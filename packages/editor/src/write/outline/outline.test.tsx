import { act } from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import type { DocNode } from "../../core";
import { Read } from "../../read/Read";
import { render } from "@testing-library/react";
import { BLOCK_TYPES } from "../blockTypes";
import { extensionsFor } from "../extensions";
import { OUTLINE_MAX_LEVELS } from "./outline";

let editor: Editor;
afterEach(() => {
  editor?.destroy();
  document.body.innerHTML = "";
});

const p = (value = ""): DocNode => (value ? { type: "paragraph", content: [{ type: "text", text: value }] } : { type: "paragraph" });
const item = (title: string, ...tree: DocNode[]): DocNode => ({ type: "outlineItem", content: [p(title), ...tree] });
const tree = (...items: DocNode[]): DocNode => ({ type: "outlineTree", content: items });

async function mount(...blocks: DocNode[]) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: blocks } });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
  return host;
}
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(async () => void editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })));
const caretAtEndOf = (text: string) =>
  act(async () => {
    let at = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === text) at = pos + text.length;
    });
    editor.commands.setTextSelection(at);
  });
/** The outline as the nested titles it holds, to compare the shape without the node noise. */
const shape = (node: DocNode | undefined): unknown =>
  node?.type === "outlineTree"
    ? (node.content ?? []).map((child) => shape(child))
    : node?.type === "outlineItem"
      ? [node.content?.[0].content?.map((t) => t.text).join("") ?? "", ...(node.content?.[1] ? [shape(node.content[1])] : [])]
      : node?.type;

describe("an outline in the editor", () => {
  it("is listed in the menus, and draws as the list Cuboid styles, its items the list's own children", async () => {
    expect(BLOCK_TYPES.find((type) => type.label === "Outline")).toMatchObject({ group: "basic", convert: true });
    const host = await mount(tree(item("One", tree(item("a"))), item("Two")));
    const list = host.querySelector('ol[data-component="OutlineTree"]')!;
    expect([...list.children].map((child) => child.getAttribute("data-component"))).toEqual(["OutlineTree.Item", "OutlineTree.Item"]);
    expect(list.querySelectorAll('ol[data-component="OutlineTree"]')).toHaveLength(1);
    // The title is the item's first child, where Cuboid's rules look for it.
    expect(list.querySelector("li")!.firstElementChild!.tagName).toBe("P");
  });

  it("turns a paragraph into an outline with one item", async () => {
    await mount(p("Plan"));
    await caretAtEndOf("Plan");
    const type = BLOCK_TYPES.find((t) => t.label === "Outline")!;
    await act(async () => void type.apply(editor.chain().focus()).run());
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["Plan"]]);
  });

  it("Enter starts the next item, in the same tree", async () => {
    await mount(tree(item("One", tree(item("a")))));
    await caretAtEndOf("a");
    await press("Enter");
    await act(async () => void editor.commands.insertContent("b"));
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One", [["a"], ["b"]]]]);
  });

  it("Tab sets an item under the one above it, with what hangs from it; Shift-Tab brings it back", async () => {
    await mount(tree(item("One"), item("Two", tree(item("a")))));
    await caretAtEndOf("Two");
    await press("Tab");
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One", [["Two", [["a"]]]]]]);
    await press("Tab", { shiftKey: true });
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One"], ["Two", [["a"]]]]);
  });

  it("does nothing on a Tab with no item above, and on a Shift-Tab at the first level, and keeps the caret", async () => {
    await mount(tree(item("One")));
    await caretAtEndOf("One");
    await press("Tab");
    await press("Tab", { shiftKey: true });
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One"]]);
    expect(editor.state.selection.$from.parent.textContent).toBe("One");
  });

  it(`stops at ${OUTLINE_MAX_LEVELS} levels, counting what hangs from the item`, async () => {
    await mount(tree(item("One", tree(item("a", tree(item("a.1", tree(item("a.1.1")))))))), tree(item("x"), item("y", tree(item("y1")))));
    await caretAtEndOf("a.1.1");
    await press("Tab");
    // Nothing above it to sink under, and no more levels: unchanged.
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One", [["a", [["a.1", [["a.1.1"]]]]]]]]);
    // `y` with `y1` under it is two levels: under `x` it would be level 2 and 3, which fits.
    await caretAtEndOf("y");
    await press("Tab");
    expect(shape(editor.getJSON().content?.[1] as DocNode)).toEqual([["x", [["y", [["y1"]]]]]]);
  });

  it("Backspace at the start of a title takes the item out a level, and out of the outline from the root", async () => {
    await mount(tree(item("One", tree(item("a")))));
    await act(async () => {
      let at = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text === "a") at = pos;
      });
      editor.commands.setTextSelection(at);
    });
    await press("Backspace");
    expect(shape(editor.getJSON().content?.[0] as DocNode)).toEqual([["One"], ["a"]]);
  });

  it("is read as the same outline, without the editor", () => {
    const { container } = render(<Read node={{ type: "doc", content: [tree(item("One", tree(item("a"))), item("Two"))] }} />);
    const list = container.querySelector('ol[data-component="OutlineTree"]')!;
    expect([...list.children].map((child) => child.tagName)).toEqual(["LI", "LI"]);
    expect(list.querySelector("li > p")).toHaveTextContent("One");
    expect(list.querySelectorAll('ol[data-component="OutlineTree"]')).toHaveLength(1);
  });
});
