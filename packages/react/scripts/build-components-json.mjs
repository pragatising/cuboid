// Reads every exported component's props from the TypeScript types and JSDoc and writes dev/generated/components.json,
// the data behind the docs shell's Properties (and, later, an llms.txt and a CI check). Nothing in it is written by hand.
// Run: npm run build:components-json
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.join(root, "src/index.ts");
const outFile = path.join(root, "dev/generated/components.json");

const program = ts.createProgram([entry], {
  jsx: ts.JsxEmit.ReactJSX,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  skipLibCheck: true,
  strict: true,
  noEmit: true,
  types: [],
});
const checker = program.getTypeChecker();
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const text = (type) => checker.typeToString(type, undefined, flags).replace(/ \| undefined$/, "");
const MAX_VALUES = 24;

/** What a prop is, from the shape of its type alone. The stylesheet refines this later (look axis, size axis, state). */
function classify(name, type) {
  const members = type.isUnion() ? type.types.filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [type];
  const str = text(type);
  if (name === "ref") return { kind: "ref" };
  if (members.every((t) => t.flags & ts.TypeFlags.BooleanLike)) return { kind: "flag" };
  if (members.length && members.every((t) => t.isStringLiteral() || t.isNumberLiteral())) {
    const values = members.map((t) => (t.isStringLiteral() ? t.value : t.value));
    return values.length <= MAX_VALUES ? { kind: "enum", values } : { kind: "open", typeAlias: type.aliasSymbol?.name, valueCount: values.length };
  }
  if (members.some((t) => t.getCallSignatures().length)) return { kind: /^on[A-Z]/.test(name) ? "event" : "function" };
  if (/ReactNode|ReactElement/.test(str)) return { kind: "slot" };
  const alias = members.find((t) => t.aliasSymbol)?.aliasSymbol?.name ?? type.aliasSymbol?.name;
  if (members.some((t) => t.isStringLiteral()) && members.some((t) => t.flags & ts.TypeFlags.String)) return { kind: "open", typeAlias: alias };
  if (members.every((t) => t.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike))) return { kind: "value" };
  return { kind: "other" };
}

/** `x`, `defaultX` and `onXChange` together are one controllable piece of state. */
function controlled(names) {
  const set = new Set(names);
  return names.filter((n) => /^on[A-Z]\w*Change$/.test(n)).map((n) => n.slice(2, -6)).map((s) => s[0].toLowerCase() + s.slice(1)).filter((x) => set.has(x));
}

function describeProps(propsType, decl, own) {
  const props = [];
  let native = 0;
  for (const p of checker.getPropertiesOfType(propsType)) {
    const d = p.declarations?.[0];
    if (!d) continue;
    if (d.getSourceFile().fileName.includes("node_modules")) {
      native += 1;
      continue;
    }
    const type = checker.getTypeOfSymbolAtLocation(p, d);
    const tags = p.getJsDocTags(checker);
    const tag = (n) => tags.find((t) => t.name === n);
    const description = ts.displayPartsToString(p.getDocumentationComment(checker)).trim();
    props.push({
      name: p.name,
      required: !(p.flags & ts.SymbolFlags.Optional),
      type: text(type),
      ...classify(p.name, type),
      default: tag("default") ? ts.displayPartsToString(tag("default").text).trim().replace(/^`|`$/g, "") : undefined,
      description: description || undefined,
      deprecated: tag("deprecated") ? ts.displayPartsToString(tag("deprecated").text).trim() || true : undefined,
      source: path.relative(root, d.getSourceFile().fileName),
    });
  }
  const names = props.map((p) => p.name);
  return { name: own, props, nativeProps: native, controlled: controlled(names) };
}

const out = {};
const sf = program.getSourceFile(entry);
for (const exp of checker.getExportsOfModule(checker.getSymbolAtLocation(sf))) {
  if (!/^[A-Z]/.test(exp.name)) continue;
  const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
  const decl = sym.valueDeclaration;
  if (!decl) continue;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sig = type.getCallSignatures()[0];
  if (!sig) continue;
  const param = sig.getParameters()[0];
  const entryOut = param ? describeProps(checker.getTypeOfSymbolAtLocation(param, decl), decl, exp.name) : { name: exp.name, props: [], nativeProps: 0, controlled: [] };
  const jsdoc = ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();
  entryOut.description = jsdoc || undefined;
  // Compound parts: `Popover.Body` is a callable property of the component.
  entryOut.parts = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    if (!/^[A-Z]/.test(prop.name) || !prop.declarations?.length) continue;
    const partType = checker.getTypeOfSymbolAtLocation(prop, prop.declarations[0]);
    const partSig = partType.getCallSignatures()[0];
    const partParam = partSig?.getParameters()[0];
    if (!partParam) continue;
    entryOut.parts.push(describeProps(checker.getTypeOfSymbolAtLocation(partParam, prop.declarations[0]), prop.declarations[0], `${exp.name}.${prop.name}`));
  }
  out[exp.name] = entryOut;
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`);
const count = Object.keys(out).length;
const props = Object.values(out).reduce((n, c) => n + c.props.length, 0);
console.log(`components.json: ${count} components, ${props} props -> ${path.relative(root, outFile)}`);
