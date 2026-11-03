import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";

/** The JSX element the cursor is in: its tag as written (`Button`, `Menu.Item`), and where it and its opening tag are. */
export type JsxElement = { tag: string; from: number; to: number; openFrom: number; openTo: number };

const OPENING = new Set(["JSXOpenTag", "JSXSelfClosingTag"]);

/** The tag as written: a name, or a member (`Menu.Item`). */
export function tagName(state: EditorState, opening: SyntaxNode): string {
  const name = opening.getChild("JSXMemberExpression") ?? opening.getChild("JSXIdentifier");
  return name ? state.sliceDoc(name.from, name.to) : "";
}

const climb = (node: SyntaxNode | null, names: Set<string> | string): SyntaxNode | null => {
  for (let n = node; n; n = n.parent) if (typeof names === "string" ? n.name === names : names.has(n.name)) return n;
  return null;
};

/** Looks either side of a position, so a cursor at the very end or start of something still finds it. */
const around = (state: EditorState, pos: number) => {
  const tree = syntaxTree(state);
  return [tree.resolveInner(pos, -1), tree.resolveInner(pos, 1)];
};

/** The opening tag whose attributes the position is in (after its name, before its end), and the attribute it is in, if any. */
export function openTagAt(
  state: EditorState,
  pos: number,
  /** Count the position right after the tag's name as in the tag (it is where the next prop would go), not as still in the name. */
  afterName = false,
): { tag: SyntaxNode; attribute: SyntaxNode | null; inValue: boolean } | null {
  for (const node of around(state, pos)) {
    const tag = climb(node, OPENING);
    if (!tag) continue;
    const name = tag.getChild("JSXMemberExpression") ?? tag.getChild("JSXIdentifier");
    if (!name || pos < name.to || (pos === name.to && !afterName)) continue;
    const attribute = climb(node, "JSXAttribute");
    const value = attribute?.getChild("JSXAttributeValue") ?? attribute?.getChild("JSXEscape");
    return { tag, attribute: attribute && attribute.parent === tag ? attribute : null, inValue: Boolean(value && pos > value.from && pos <= value.to) };
  }
  return null;
}

/** The names of the attributes already written on an opening tag, leaving out the one at `except`. */
export function attributesOf(state: EditorState, tag: SyntaxNode, except?: SyntaxNode | null): string[] {
  const names: string[] = [];
  for (let child = tag.firstChild; child; child = child.nextSibling) {
    if (child.name !== "JSXAttribute" || (except && child.from === except.from)) continue;
    const id = child.getChild("JSXIdentifier");
    if (id) names.push(state.sliceDoc(id.from, id.to));
  }
  return names;
}

export function elementAt(state: EditorState, pos: number): JsxElement | null {
  for (const node of around(state, pos)) {
    const element = climb(node, "JSXElement");
    const opening = element && (element.getChild("JSXOpenTag") ?? element.getChild("JSXSelfClosingTag"));
    if (element && opening) return { tag: tagName(state, opening), from: element.from, to: element.to, openFrom: opening.from, openTo: opening.to };
  }
  return null;
}
