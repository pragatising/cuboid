import type { DocNode } from "../../core";
import { makeEditor } from "../../test/makeEditor";
import { focusEnd } from "./exits";

const text = (value: string): DocNode => ({ type: "text", text: value });
const para = (value = ""): DocNode => ({ type: "paragraph", ...(value ? { content: [text(value)] } : {}) });
const code = (value = ""): DocNode => ({ type: "codeBlock", attrs: { language: "text" }, ...(value ? { content: [text(value)] } : {}) });
const callout = (...content: DocNode[]): DocNode => ({ type: "callout", attrs: { color: "neutral", bordered: false }, content });
const page = (...content: DocNode[]): DocNode => ({ type: "doc", content });

const types = (editor: ReturnType<typeof makeEditor>) => editor.getJSON().content!.map((n) => n.type);
/** The text of the block the cursor is in. */
const here = (editor: ReturnType<typeof makeEditor>) => editor.state.selection.$from.parent.textContent;
const at = (editor: ReturnType<typeof makeEditor>, pos: number) => editor.commands.setTextSelection(pos);
/** A key pressed in the editor, through the view's own key handling, so what it does to the cursor counts too. True when the editor took it. */
const press = (editor: ReturnType<typeof makeEditor>, key: string, mods: { mod?: boolean } = {}) =>
  Boolean(editor.view.someProp("handleKeyDown", (handle) => handle(editor.view, new KeyboardEvent("keydown", { key, ctrlKey: mods.mod, bubbles: true, cancelable: true }))));

describe("leaving a code block", () => {
  it("ArrowDown on the last line goes to a new paragraph below it when it ends the page", () => {
    const editor = makeEditor(page(para("a"), code("x")));
    at(editor, editor.state.doc.content.size - 1);
    expect(press(editor, "ArrowDown")).toBe(true);
    expect(types(editor)).toEqual(["paragraph", "codeBlock", "paragraph"]);
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
  });

  it("ArrowDown on the last line goes into the next block when there is one, and adds nothing", () => {
    const editor = makeEditor(page(code("x"), para("next")));
    at(editor, 2);
    press(editor, "ArrowDown");
    expect(types(editor)).toEqual(["codeBlock", "paragraph"]);
    expect(here(editor)).toBe("next");
  });

  it("ArrowDown above the last line stays in the block: it is a line down", () => {
    const editor = makeEditor(page(code("one\ntwo")));
    at(editor, 2);
    expect(press(editor, "ArrowDown")).toBe(false);
    expect(types(editor)).toEqual(["codeBlock"]);
  });

  it("ArrowUp on the first line goes to the end of the block before it, and nowhere from the first block of the page", () => {
    const editor = makeEditor(page(para("before"), code("x")));
    at(editor, editor.state.doc.content.size - 2);
    press(editor, "ArrowUp");
    expect(here(editor)).toBe("before");
    expect(editor.state.selection.$from.parentOffset).toBe("before".length);

    const first = makeEditor(page(code("x")));
    at(first, 1);
    expect(press(first, "ArrowUp")).toBe(false);
  });

  it("a second Enter on an empty last line leaves the block, and takes the empty line with it; the first Enter is a new line", () => {
    const editor = makeEditor(page(code("x")));
    at(editor, 2);
    press(editor, "Enter");
    expect(types(editor)).toEqual(["codeBlock"]);
    expect(editor.getJSON().content![0].content![0].text).toBe("x\n");
    press(editor, "Enter");
    expect(types(editor)).toEqual(["codeBlock", "paragraph"]);
    expect(editor.getJSON().content![0].content![0].text).toBe("x");
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
  });

  it("Mod-Enter leaves the block at once", () => {
    const editor = makeEditor(page(code("one\ntwo")));
    at(editor, 3);
    expect(press(editor, "Enter", { mod: true })).toBe(true);
    expect(types(editor)).toEqual(["codeBlock", "paragraph"]);
  });

  it("a code block inside a callout is left into the callout, not out of it", () => {
    const editor = makeEditor(page(callout(code("x"))));
    at(editor, 3);
    press(editor, "Enter", { mod: true });
    expect(types(editor)).toEqual(["callout"]);
    expect(editor.getJSON().content![0].content!.map((n) => n.type)).toEqual(["codeBlock", "paragraph"]);
  });
});

describe("leaving a block at the end of the page", () => {
  it("ArrowDown at the end of a callout that ends the page adds a paragraph below it", () => {
    const editor = makeEditor(page(callout(para("note"))));
    at(editor, editor.state.doc.content.size - 2);
    expect(press(editor, "ArrowDown")).toBe(true);
    expect(types(editor)).toEqual(["callout", "paragraph"]);
  });

  it("ArrowDown at the end of the last paragraph is left to the editor: it already ends in text", () => {
    const editor = makeEditor(page(para("a")));
    at(editor, 2);
    expect(press(editor, "ArrowDown")).toBe(false);
    expect(types(editor)).toEqual(["paragraph"]);
  });

  it("focusEnd goes to a paragraph below a page that ends in a block that is not text, adding it, and to the end of one that ends in text", () => {
    const divider = makeEditor(page(para("a"), { type: "divider" }));
    focusEnd(divider);
    expect(types(divider)).toEqual(["paragraph", "divider", "paragraph"]);
    expect(divider.state.selection.$from.parent.type.name).toBe("paragraph");

    const text = makeEditor(page(para("a")));
    focusEnd(text);
    expect(types(text)).toEqual(["paragraph"]);
  });
});
