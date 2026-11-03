/** What an empty block says, by what it is and where it is. Only the block you are in shows it. */
export function placeholderFor({ node, editor, pos }: { node: { type: { name: string } }; editor: { state: { doc: { resolve: (pos: number) => { parent: { type: { name: string } } } } } }; pos: number }) {
  if (node.type.name === "heading") return "Heading";
  if (node.type.name !== "paragraph") return "";
  const inside = editor.state.doc.resolve(pos).parent.type.name;
  return inside === "listItem" || inside === "outlineItem" ? "List item" : inside === "blockquote" ? "Quote" : "Press / for menu or type";
}
