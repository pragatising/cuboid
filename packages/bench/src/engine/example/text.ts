import { javascriptLanguage } from "@codemirror/lang-javascript";
import type { SyntaxNode } from "@lezer/common";

const text = (source: string, node: SyntaxNode) => source.slice(node.from, node.to);
const parser = javascriptLanguage.configure({ dialect: "jsx ts" }).parser;

/** The text of one example: the exported function (or constant) of that name, as written, `export` and all. Undefined when the file has none. */
export function exampleText(source: string, name: string): string | undefined {
  const tree = parser.parse(source);
  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    if (node.name !== "ExportDeclaration") continue;
    const declaration = node.getChild("FunctionDeclaration") ?? node.getChild("VariableDeclaration");
    const id = declaration?.getChild("VariableDefinition");
    if (id && text(source, id) === name) return text(source, node);
  }
  return undefined;
}
