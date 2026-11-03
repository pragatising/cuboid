import { TextSelection } from "@tiptap/pm/state";
import type { DocNode } from "../core";
import { makeEditor } from "../test/makeEditor";

const make = (content: DocNode) => makeEditor(content);

const bold = [{ type: "bold" }];
const text = (value: string, marks?: DocNode["marks"]): DocNode => ({ type: "text", text: value, marks });
const para = (...content: DocNode[]): DocNode => ({ type: "paragraph", content });
const columns = (n: number, inner: DocNode[] = [para(text("x"))]): DocNode => ({
  type: "columns",
  content: Array.from({ length: n }, () => ({ type: "column", content: inner })),
});

const doc: DocNode = {
  type: "doc",
  content: [
    para(text("hello "), text("brave new", bold), text(" world")),
    { type: "callout", attrs: { color: "yellow", bordered: false }, content: [para(text("careful"))] },
    { type: "divider" },
    para(text("tail")),
  ],
};

describe("the bugs the portfolio's text engine kept having", () => {
  it("Enter in the middle of bold keeps bold on both halves", () => {
    const editor = make(doc);
    // After "brave": the paragraph opens at 1, then "hello " (6) and "brave" (5).
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1 + 6 + 5)));
    editor.commands.splitBlock();
    const [first, second] = editor.getJSON().content!;
    expect(first.content!.at(-1)).toEqual({ type: "text", text: "brave", marks: bold });
    expect(second.content![0]).toMatchObject({ text: " new", marks: bold });
  });

  it("a selection across blocks deletes and merges in one step, and one undo restores it", () => {
    const editor = make(doc);
    const before = JSON.stringify(editor.getJSON());
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 4, editor.state.doc.content.size - 3)));
    editor.commands.deleteSelection();
    expect(editor.getJSON().content!.length).toBeLessThan(4);
    editor.commands.undo();
    expect(JSON.stringify(editor.getJSON())).toBe(before);
  });

  it("select-all covers every block, atoms included", () => {
    const editor = make(doc);
    editor.commands.selectAll();
    expect(editor.state.selection.from).toBe(0);
    expect(editor.state.selection.to).toBe(editor.state.doc.content.size);
  });

  it("block attributes and the document round-trip as plain JSON, and the document is valid", () => {
    const editor = make(doc);
    expect(() => editor.state.doc.check()).not.toThrow();
    expect(editor.getJSON().content![1]).toEqual(doc.content![1]);
    expect(editor.getJSON().content![2]).toEqual({ type: "divider" });
  });

  it("a date mention is an inline atom that round-trips", () => {
    const withDate = { type: "doc", content: [para({ type: "date", attrs: { iso: "2026-11-12" } })] };
    expect(make(withDate).getJSON().content![0].content![0]).toEqual({ type: "date", attrs: { iso: "2026-11-12" } });
  });
});

describe("columns are a schema rule", () => {
  const valid = (content: DocNode) => {
    try {
      make({ type: "doc", content: [para()] }).schema.nodeFromJSON({ type: "doc", content: [content] }).check();
      return true;
    } catch {
      return false;
    }
  };

  it("takes 2 to 4 columns", () => {
    expect([1, 2, 4, 5].map((n) => valid(columns(n)))).toEqual([false, true, true, false]);
  });

  it("cannot nest columns inside a column", () => {
    expect(valid(columns(2, [columns(2)]))).toBe(false);
  });

  it("select-all, delete and undo leave a valid document, then restore it", () => {
    const editor = make({ type: "doc", content: [para(text("x")), columns(2), para(text("y"))] });
    const before = JSON.stringify(editor.getJSON());
    editor.commands.selectAll();
    editor.commands.deleteSelection();
    expect(() => editor.state.doc.check()).not.toThrow();
    editor.commands.undo();
    expect(JSON.stringify(editor.getJSON())).toBe(before);
  });
});

describe("headings", () => {
  it.each([1, 2, 3, 4, 5, 6])("holds a level %i heading", (level) => {
    const editor = make({ type: "doc", content: [{ type: "heading", attrs: { level }, content: [text("h")] }] });
    expect(() => editor.state.doc.check()).not.toThrow();
    expect(editor.getJSON().content![0].attrs).toEqual({ level });
  });
});
