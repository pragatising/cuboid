import ts from "typescript";
import path from "node:path";
const root = process.cwd();
const entry = path.join(root, "src/index.ts");
const program = ts.createProgram([entry], { jsx: ts.JsxEmit.ReactJSX, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, skipLibCheck: true, strict: true, allowImportingTsExtensions: true, noEmit: true, types: [] , baseUrl: root, paths: {}});
const checker = program.getTypeChecker();
const sf = program.getSourceFile(entry);
const mod = checker.getSymbolAtLocation(sf);
const out = {};
for (const exp of checker.getExportsOfModule(mod)) {
  if (!/^[A-Z]/.test(exp.name)) continue;
  const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
  const decl = sym.valueDeclaration; if (!decl) continue;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sigs = type.getCallSignatures(); if (!sigs.length) continue;
  const param = sigs[0].getParameters()[0]; if (!param) { out[exp.name] = []; continue; }
  const pt = checker.getTypeOfSymbolAtLocation(param, decl);
  const props = [];
  for (const p of checker.getPropertiesOfType(pt)) {
    const d = p.declarations?.[0]; if (!d) continue;
    const file = d.getSourceFile().fileName;
    if (file.includes("node_modules")) continue;
    const t = checker.getTypeOfSymbolAtLocation(p, d);
    const doc = ts.displayPartsToString(p.getDocumentationComment(checker)).replace(/\s+/g, " ").trim();
    props.push({ name: p.name, opt: !!(p.flags & ts.SymbolFlags.Optional), type: checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation).slice(0, 110), doc: doc.slice(0, 90), file: path.relative(root, file) });
  }
  out[exp.name] = props;
}
console.log(JSON.stringify(out, null, 1));
