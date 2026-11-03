import path from "node:path";
import ts from "typescript";
import { createExtractor } from "./extractModel";
import type { Extraction } from "./extractModel";
import { allElements } from "./printModel";

/** The compiler options the components are written for; the same as the props extraction that builds `components.json`. */
export const COMPILER_OPTIONS: ts.CompilerOptions = {
  jsx: ts.JsxEmit.ReactJSX,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  skipLibCheck: true,
  strict: true,
  noEmit: true,
  types: [],
};

export type Library = {
  /** The model of every exported component, by the name it is exported as. */
  components: Record<string, Extraction>;
  /** Those, and every component they use that is written in this project, by where it is written. */
  all: Record<string, Extraction>;
  /** Exports that start with a capital but whose declaration the extractor could not read as a component. */
  unread: string[];
  extractor: ReturnType<typeof createExtractor>;
};

/** Extracts every component a library's entry file exports. A component is a capitalised export that is a function (possibly wrapped). */
export function extractLibrary(entry: string, root = process.cwd()): Library {
  const program = ts.createProgram([entry], COMPILER_OPTIONS);
  const extractor = createExtractor(program, root);
  const { checker } = extractor;
  const entryFile = program.getSourceFile(entry);
  const moduleSymbol = entryFile && checker.getSymbolAtLocation(entryFile);
  const components: Record<string, Extraction> = {};
  const unread: string[] = [];
  const all: Record<string, Extraction> = {};
  if (!moduleSymbol) return { components, all, unread, extractor };

  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    if (!/^[A-Z]/.test(symbol.name)) continue;
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const declaration = target.declarations?.find((d) => ts.isFunctionDeclaration(d) || ts.isVariableDeclaration(d));
    if (!declaration || declaration.getSourceFile().fileName.includes("node_modules")) continue;
    const localName = ts.getNameOfDeclaration(declaration)?.getText();
    const extraction = localName ? extractor.extract(declaration.getSourceFile(), localName, symbol.name) : null;
    if (extraction) {
      components[symbol.name] = extraction;
      all[extraction.model.declared] = extraction;
    } else unread.push(symbol.name);
  }

  // The components these use, and the ones those use, so a reference can be followed to the code behind it (Button is `ButtonBase`).
  const queue = Object.values(all);
  for (let next = queue.shift(); next; next = queue.shift()) {
    const used = [
      ...allElements(next.model).map((element) => (element.type.kind === "component" ? element.type.declared : undefined)),
      ...next.model.statics.map((item) => item.declared),
      ...next.model.hooks.map((hook) => hook.declared),
    ];
    for (const declared of used) {
      if (!declared || all[declared]) continue;
      const [file, name] = declared.split("#");
      const sourceFile = program.getSourceFile(path.join(root, file));
      const extraction = sourceFile && extractor.extract(sourceFile, name);
      if (extraction) {
        all[declared] = extraction;
        queue.push(extraction);
      }
    }
  }
  return { components, all, unread, extractor };
}
