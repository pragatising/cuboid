// Reads a library's components from its TypeScript program: each exported component's props (every member of its props type, in order, with the types, values,
// defaults and descriptions the code gives), its parts, and a count of what the platform adds. Nothing here names a library, a folder layout or a naming rule:
// it reads types, symbols and declarations. `components-json.mjs` runs it for the configured library; the tests run it on fixture libraries.
import ts from "typescript";
import path from "node:path";
import crypto from "node:crypto";

/**
 * `entries`: the files whose exports are read. `root`: what `source` paths are relative to. `packageRoots`: the folders of the packages the library is made of;
 * a prop declared outside them (the platform's typings, `node_modules`) is not the library's: it is counted, not listed.
 */
export function readLibrary({ entries, root, packageRoots }) {
const program = ts.createProgram(entries, {
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
/** Every member of a union, through the unions named inside it: `Length` is `SizeScale | (string & {})`, and `SizeScale` is its own list of values. */
const flatten = (t) => (t.isUnion() ? t.types.flatMap(flatten) : [t]);
const literalOf = (t) => (t.isStringLiteral() || t.isNumberLiteral() ? t.value : undefined);
const isFree = (t) => !!(t.flags & (ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.TemplateLiteral)) || (t.isIntersection() && t.types.some((x) => x.flags & ts.TypeFlags.String));
/** `${number}px` as the person would write it: what a free value looks like. */
const freeLabel = (t) => (t.flags & ts.TypeFlags.Number ? "number" : t.flags & ts.TypeFlags.String || t.isIntersection() ? "text" : text(t).replace(/\$\{[^}]*\}/g, "…").replace(/^`|`$/g, ""));

/** The parts of a type as written: `A | (B | C) | "x"` is A, B, C and "x", each as a type node of its own. */
const writtenParts = (node) => (ts.isParenthesizedTypeNode(node) ? writtenParts(node.type) : ts.isUnionTypeNode(node) ? node.types.flatMap(writtenParts) : [node]);

/** The same parts, from the type as the person wrote it: `BorderToken | CssBorder | BorderSpec` keeps its names, where the checker has flattened them into one list of values. */
function membersWritten(node) {
  const found = [];
  const loose = { values: [], free: [], text: [] };
  for (const part of writtenParts(node)) {
    const type = checker.getTypeFromTypeNode(part);
    if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) continue;
    const inner = unionOf(type).flatMap(flatten);
    if (inner.some((t) => t.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive)) && !inner.some((t) => isFree(t) || literalOf(t) !== undefined)) continue;
    const values = inner.map(literalOf).filter((v) => v !== undefined);
    const free = [...new Set(inner.filter((t) => literalOf(t) === undefined && isFree(t)).map(freeLabel))].slice(0, 3);
    if (!values.length && !free.length) continue;
    // A named part (`BorderToken`, `keyof Tokens["zIndex"]`) is a set of its own; a literal or a primitive written inline joins the others.
    if (ts.isTypeReferenceNode(part) || ts.isTypeOperatorNode(part) || ts.isIndexedAccessTypeNode(part)) {
      const name = part.getText();
      if (values.length) sets[name] = values;
      found.push({ name, ...(values.length ? { set: name } : {}), ...(free.length ? { free } : {}) });
    } else {
      loose.values.push(...values);
      loose.free.push(...free);
      loose.text.push(part.getText());
    }
  }
  if (loose.values.length || loose.free.length) {
    const free = [...new Set(loose.free)].slice(0, 3);
    const name = loose.text.join(" | ");
    const set = loose.values.length > 20 ? `values-${crypto.createHash("sha1").update(loose.values.join("|")).digest("hex").slice(0, 8)}` : undefined;
    if (set) sets[set] = loose.values;
    found.push({ name, ...(set ? { set } : loose.values.length ? { values: loose.values } : {}), ...(free.length ? { free } : {}) });
  }
  return found.some((m) => m.set || m.values) ? found : undefined;
}

/**
 * What a value-typed prop can be, in the parts its type is written in: a named set of values (`FgColor`: pick one), loose values
 * (`"xs" | "sm"`: pick one), or anything of a shape (`number`, `#${string}`: type it). A prop whose type is only one of these, or no
 * values at all, has no parts: the types say all there is. Objects (a responsive `SizeSpec`) are left out: they are not a value to pick.
 */
function members(kind, type, node) {
  if (!["value", "other", "open"].includes(kind)) return undefined;
  // The names the code gives are the ones to show, so the type as written is read when it can be.
  if (node) return membersWritten(node);
  const found = [];
  const loose = { values: [], free: [] };
  const parts = unionOf(type);
  // A union that is one named set (`IconName`): its members are its values, and it is called by its name.
  const wholly = type.aliasSymbol && parts.every((t) => literalOf(t) !== undefined);
  for (const part of wholly ? [type] : parts) {
    if (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) continue;
    const inner = unionOf(part).flatMap(flatten);
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

/** Whether a file is outside the library: the platform's typings, another package's, `node_modules`. What is declared there is not the library's own: it is counted. */
const outside = (file) => file.includes("node_modules") || !packageRoots.some((dir) => file.startsWith(dir + path.sep));
/** Where each prop of a mapped part of a props type is declared: a mapped type (`{ [K in PaddingProp]?: SpaceValue }`) gives its props no declaration of their own, so the part is asked. */
function mappedOrigins(type, into = new Map()) {
  for (const part of type.isIntersection() ? type.types : [type]) {
    if (part.isIntersection()) {
      mappedOrigins(part, into);
      continue;
    }
    const declaration = part.symbol?.declarations?.[0] ?? part.aliasSymbol?.declarations?.[0];
    const file = declaration?.getSourceFile().fileName;
    if (!file || outside(file)) continue;
    // A mapped type (`{ [K in PaddingProp]?: SpaceValue }`) writes one type for all its props.
    const node = declaration && ts.isMappedTypeNode(declaration) ? declaration.type : undefined;
    for (const p of checker.getPropertiesOfType(part)) if (!into.has(p.name)) into.set(p.name, { file, node });
  }
  return into;
}

function describeProps(propsType, decl, own) {
  const props = [];
  const native = { dom: 0, css: 0 };
  const origins = mappedOrigins(propsType);
  for (const p of checker.getPropertiesOfType(propsType)) {
    // A prop the library declares that the platform has too (`title`, `color`) has both declarations: it is the library's, so its own declaration is the one read.
    const d = p.declarations?.find((declaration) => !outside(declaration.getSourceFile().fileName)) ?? p.declarations?.[0];
    const mapped = d ? undefined : origins.get(p.name);
    const file = (d ? d.getSourceFile().fileName : mapped?.file) ?? "";
    if (!file) continue;
    if (outside(file)) {
      // What the platform and other packages add (the element's attributes, CSS): counted, not listed.
      if (file.includes("csstype")) native.css += 1;
      else native.dom += 1;
      continue;
    }
    const type = d ? checker.getTypeOfSymbolAtLocation(p, d) : checker.getTypeOfSymbol(p);
    // The type as the code writes it (`BorderColor | CssColor`), where there is a node for it.
    const writtenNode = d ? (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d) ? d.type : undefined) : mapped?.node;
    const tags = p.getJsDocTags(checker);
    const tag = (n) => tags.find((t) => t.name === n);
    const description = ts.displayPartsToString(p.getDocumentationComment(checker)).trim();
    props.push({
      name: p.name,
      required: !(p.flags & ts.SymbolFlags.Optional),
      type: text(type),
      ...classify(p.name, type),
      members: members(classify(p.name, type).kind, type, writtenNode),
      written: writtenNode ? writtenNode.getText().replace(/\s*\|\s*undefined$/, "") : undefined,
      default: tag("default") ? ts.displayPartsToString(tag("default").text).trim().replace(/^`|`$/g, "") : undefined,
      description: description || undefined,
      deprecated: tag("deprecated") ? ts.displayPartsToString(tag("deprecated").text).trim() || true : undefined,
      source: path.relative(root, file),
      // Written as a mapped type (`{ [K in PaddingProp]?: SpaceValue }`): it has no declaration of its own, so the engine's model, which reads declarations, does not have it.
      ...(d ? {} : { mapped: true }),
    });
  }
  const names = props.map((p) => p.name);
  return { name: own, props, native, nativeProps: native.dom + native.css, controlled: controlled(names) };
}

const out = {};
for (const entry of entries) for (const exp of checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)))) {
  if (!/^[A-Z]/.test(exp.name)) continue;
  const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
  const decl = sym.valueDeclaration;
  if (!decl) continue;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  // A component is a function of its props, or a class that has them: of a union (`ComponentType<P>` is a class or a function) the first that is one.
  const forms = type.isUnion() ? type.types : [type];
  const sig = forms.map((form) => form.getCallSignatures()[0]).find(Boolean);
  const instance = sig ? undefined : forms.map((form) => form.getConstructSignatures()[0]?.getReturnType()).find(Boolean);
  const classProps = instance?.getProperty("props");
  if (!sig && !classProps) continue;
  const param = sig?.getParameters()[0];
  const entryOut = param || classProps ? describeProps(param ? checker.getTypeOfSymbolAtLocation(param, decl) : checker.getTypeOfSymbolAtLocation(classProps, decl), decl, exp.name) : { name: exp.name, props: [], native: { dom: 0, css: 0 }, nativeProps: 0, controlled: [] };
  const jsdoc = ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();
  entryOut.description = jsdoc || undefined;
  // Compound parts: `Overlay.Body` is a callable property of the component.
  entryOut.parts = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    if (!/^[A-Z]/.test(prop.name) || !prop.declarations?.length) continue;
    const partType = checker.getTypeOfSymbolAtLocation(prop, prop.declarations[0]);
    const partSig = partType.getCallSignatures()[0];
    const partParam = partSig?.getParameters()[0];
    if (!partParam) continue;
    const part = describeProps(checker.getTypeOfSymbolAtLocation(partParam, prop.declarations[0]), prop.declarations[0], `${exp.name}.${prop.name}`);
    entryOut.parts.push(part);
  }
  out[exp.name] = entryOut;
}
  return { components: out, sets };
}
