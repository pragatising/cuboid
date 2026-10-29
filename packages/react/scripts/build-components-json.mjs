// Reads every exported component's props from the TypeScript types and JSDoc and writes dev/generated/components.json,
// the data behind the docs shell's Properties (and, later, an llms.txt and a CI check). Nothing in it is written by hand.
// Run: npm run build:components-json
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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

/** The sets of values a prop's types name (`FgColor`, `SizeScale`), once each: the prop says which, so the list is not written for every prop that uses it. */
const sets = {};
const unionOf = (t) => (t.isUnion() ? (t.origin?.isUnion() ? t.origin.types : t.types) : [t]);
const literalOf = (t) => (t.isStringLiteral() || t.isNumberLiteral() ? t.value : undefined);
const isFree = (t) => !!(t.flags & (ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.TemplateLiteral)) || (t.isIntersection() && t.types.some((x) => x.flags & ts.TypeFlags.String));
/** `${number}px` as the person would write it: what a free value looks like. */
const freeLabel = (t) => (t.flags & ts.TypeFlags.Number ? "number" : t.flags & ts.TypeFlags.String || t.isIntersection() ? "text" : text(t).replace(/\$\{[^}]*\}/g, "…").replace(/^`|`$/g, ""));

/**
 * What a value-typed prop can be, in the parts its type is written in: a named set of values (`FgColor`: pick one), loose values
 * (`"xs" | "sm"`: pick one), or anything of a shape (`number`, `#${string}`: type it). A prop whose type is only one of these, or no
 * values at all, has no parts: the types say all there is. Objects (a responsive `SizeSpec`) are left out: they are not a value to pick.
 */
function members(kind, type) {
  if (!["value", "other", "open"].includes(kind)) return undefined;
  const found = [];
  const loose = { values: [], free: [] };
  const parts = unionOf(type);
  // A union that is one named set (`IconName`): its members are its values, and it is called by its name.
  const wholly = type.aliasSymbol && parts.every((t) => literalOf(t) !== undefined);
  for (const part of wholly ? [type] : parts) {
    if (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) continue;
    const inner = unionOf(part);
    if (inner.some((t) => t.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive)) && !inner.some((t) => isFree(t) || literalOf(t) !== undefined)) continue;
    const values = inner.map(literalOf).filter((v) => v !== undefined);
    const free = [...new Set(inner.filter((t) => literalOf(t) === undefined && isFree(t)).map(freeLabel))].slice(0, 3);
    const alias = part.aliasSymbol?.name;
    if (alias && (values.length || free.length)) {
      if (values.length) sets[alias] = values;
      found.push({ name: alias, ...(values.length ? { set: alias } : {}), ...(free.length ? { free } : {}) });
    } else {
      loose.values.push(...values);
      loose.free.push(...free);
    }
  }
  if (loose.values.length || loose.free.length) {
    const free = [...new Set(loose.free)].slice(0, 3);
    // A long list of loose values is kept once, whichever prop has it.
    const set = loose.values.length > 20 ? `values-${crypto.createHash("sha1").update(loose.values.join("|")).digest("hex").slice(0, 8)}` : undefined;
    if (set) sets[set] = loose.values;
    found.push({ name: "values", ...(set ? { set } : loose.values.length ? { values: loose.values } : {}), ...(free.length ? { free } : {}) });
  }
  // Folded to what a person chooses between: a set, loose values, and the shapes typed. Only worth saying when there is something to pick.
  return found.some((m) => m.set || m.values) ? found : undefined;
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
      members: members(classify(p.name, type).kind, type),
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
fs.writeFileSync(path.join(path.dirname(outFile), "token-sets.json"), JSON.stringify(sets));
const count = Object.keys(out).length;
const props = Object.values(out).reduce((n, c) => n + c.props.length, 0);
console.log(`components.json: ${count} components, ${props} props -> ${path.relative(root, outFile)}`);
