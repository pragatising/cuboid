import { Editor } from "@tiptap/core";
import type { DocNode } from "../../core";
import { BLOCK_TYPES, blockTypeGroups, matchBlockTypes, typeOf } from "../blockTypes";
import { blockAtPos, canMoveBlock, deleteBlock, moveBlock, setBlockAttrs, turnInto, unwrapBlock } from "./blockCommands";
import { makeEditor } from "../../test/makeEditor";

const text = (value: string, marks?: DocNode["marks"]): DocNode => ({ type: "text", text: value, marks });
const para = (value = ""): DocNode => ({ type: "paragraph", content: value ? [text(value)] : [] });
const make = (...blocks: DocNode[]) => makeEditor({ type: "doc", content: blocks });
const texts = (editor: Editor) => (editor.getJSON().content ?? []).map((n) => n.content?.[0]?.text ?? n.type);
const typeByValue = (value: string) => BLOCK_TYPES.find((t) => t.value === value)!;
const columns = (...cols: DocNode[][]): DocNode => ({ type: "columns", content: cols.map((content) => ({ type: "column", content })) });

describe("blockAtPos", () => {
  it("finds the block that holds a position in its text", () => {
    const editor = make(para("one"), para("two"));
    expect(blockAtPos(editor.state.doc, 2)).toMatchObject({ start: 0, node: { type: { name: "paragraph" } } });
    expect(blockAtPos(editor.state.doc, 7)?.start).toBe(5);
  });

  it("finds an atom at its own start", () => {
    const editor = make(para("one"), { type: "divider" });
    expect(blockAtPos(editor.state.doc, 5)?.node.type.name).toBe("divider");
  });

  it("finds a block inside a column, not the columns block around it", () => {
    const editor = make(columns([para("left")], [para("right"), { type: "divider" }]));
    const doc = editor.state.doc;
    const columnsNode = doc.child(0);
    const secondColumnStart = 1 + columnsNode.child(0).nodeSize;
    const found = blockAtPos(doc, secondColumnStart + 3);
    expect(found?.node.type.name).toBe("paragraph");
    expect(found?.node.textContent).toBe("right");
    expect(blockAtPos(doc, found!.start + found!.node.nodeSize)?.node.type.name).toBe("divider");
  });

  it("takes a nested list as one block", () => {
    const editor = make({ type: "bulletList", content: [{ type: "listItem", content: [para("item")] }] });
    expect(blockAtPos(editor.state.doc, 4)?.node.type.name).toBe("bulletList");
  });
});

describe("moving and deleting blocks", () => {
  it("swaps a block with its neighbour and keeps it selected", () => {
    const editor = make(para("a"), para("b"), para("c"));
    const landed = moveBlock(editor, 3, 1);
    expect(texts(editor)).toEqual(["a", "c", "b"]);
    expect(landed).toBe(editor.state.selection.from);
    expect(moveBlock(editor, landed!, -1)).not.toBeNull();
    expect(texts(editor)).toEqual(["a", "b", "c"]);
  });

  it("does nothing at either end", () => {
    const editor = make(para("a"), para("b"));
    expect(canMoveBlock(editor, 0, -1)).toBe(false);
    expect(moveBlock(editor, 0, -1)).toBeNull();
    expect(canMoveBlock(editor, 3, 1)).toBe(false);
    expect(texts(editor)).toEqual(["a", "b"]);
  });

  it("moves a block within its column only", () => {
    const editor = make(columns([para("x"), para("y")], [para("z")]));
    const first = 2;
    expect(moveBlock(editor, first, 1)).not.toBeNull();
    const column = editor.getJSON().content![0].content![0];
    expect(column.content!.map((n) => n.content![0].text)).toEqual(["y", "x"]);
    expect(canMoveBlock(editor, 2 + editor.state.doc.nodeAt(2)!.nodeSize, 1)).toBe(false);
  });

  it("one undo puts a moved block back", () => {
    const editor = make(para("a"), para("b"));
    moveBlock(editor, 0, 1);
    editor.commands.undo();
    expect(texts(editor)).toEqual(["a", "b"]);
  });

  it("deletes a block, and leaves an empty paragraph rather than an empty page or column", () => {
    const editor = make(para("a"), para("b"));
    deleteBlock(editor, 0);
    expect(texts(editor)).toEqual(["b"]);
    deleteBlock(editor, 0);
    expect(editor.getJSON().content).toEqual([{ type: "paragraph" }]);

    const inColumn = make(columns([para("only")], [para("other")]));
    deleteBlock(inColumn, 2);
    expect(() => inColumn.state.doc.check()).not.toThrow();
    expect(inColumn.getJSON().content![0].content![0].content).toEqual([{ type: "paragraph" }]);
  });
});

describe("turning a block into another type", () => {
  it("keeps the text and its marks, in one undoable step", () => {
    const editor = make({ type: "paragraph", content: [text("plain "), text("bold", [{ type: "bold" }])] });
    turnInto(editor, 0, typeByValue("h2"));
    expect(editor.getJSON().content![0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(editor.getJSON().content![0].content![1]).toEqual(text("bold", [{ type: "bold" }]));
    editor.commands.undo();
    expect(editor.getJSON().content![0].type).toBe("paragraph");
  });

  it.each([["bulletList"], ["orderedList"], ["blockquote"], ["callout"]])("turns a paragraph into %s", (value) => {
    const editor = make(para("x"));
    turnInto(editor, 0, typeByValue(value));
    expect(editor.getJSON().content![0].type).toBe(value);
    expect(typeOf(editor.state.doc.child(0))).toBe(value);
  });

  it("reports the type a block is, so the menu can check it", () => {
    const editor = make(para("p"), { type: "heading", attrs: { level: 3 }, content: [text("h")] });
    expect([typeOf(editor.state.doc.child(0)), typeOf(editor.state.doc.child(1))]).toEqual(["paragraph", "h3"]);
  });
});

describe("block types", () => {
  it("matches a query against labels and keywords", () => {
    expect(matchBlockTypes("head").map((t) => t.value)).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
    expect(matchBlockTypes("ol").map((t) => t.value)).toContain("orderedList");
    expect(matchBlockTypes("col").map((t) => t.value)).toEqual(["columns-2", "columns-3"]);
    expect(matchBlockTypes("zzz")).toEqual([]);
    expect(matchBlockTypes("")).toHaveLength(BLOCK_TYPES.length);
  });

  it("lists only what can be converted in the turn-into menu", () => {
    const labels = blockTypeGroups(BLOCK_TYPES, true).flatMap((g) => g.options.map((o) => o.label));
    expect(labels).toContain("Heading 1");
    expect(labels).not.toContain("Divider");
    expect(labels).not.toContain("2 columns");
    expect(blockTypeGroups(BLOCK_TYPES, false).map((g) => g.label)).toEqual(["Basic Blocks", "Media", "Layout", "Inline"]);
  });

  it("applies every type without leaving an invalid document", () => {
    for (const type of BLOCK_TYPES) {
      const editor = make(para("x"));
      editor.commands.setTextSelection(2);
      type.apply(editor.chain().focus()).run();
      expect(() => editor.state.doc.check(), type.value).not.toThrow();
    }
  });
});

describe("changing a block's attributes", () => {
  const callout = (color = "neutral"): DocNode => ({ type: "callout", attrs: { color, bordered: false }, content: [para("inside")] });

  it("sets them and keeps the block selected, so a panel open on it stays open", () => {
    const editor = make(callout());
    setBlockAttrs(editor, 0, { color: "blue", bordered: true });
    expect(editor.getJSON().content![0].attrs).toEqual({ color: "blue", bordered: true });
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
    expect(editor.state.selection.from).toBe(0);
  });

  it("changes only what it is given", () => {
    const editor = make(callout("red"));
    setBlockAttrs(editor, 0, { bordered: true });
    expect(editor.getJSON().content![0].attrs).toEqual({ color: "red", bordered: true });
  });

  it("is one undo", () => {
    const editor = make(callout("red"));
    setBlockAttrs(editor, 0, { color: "green" });
    editor.commands.undo();
    expect(editor.getJSON().content![0].attrs).toMatchObject({ color: "red" });
  });
});

describe("removing a callout and keeping its contents", () => {
  it("puts what it held in its place, in order", () => {
    const editor = make(para("before"), { type: "callout", attrs: { color: "blue", bordered: false }, content: [para("one"), para("two")] }, para("after"));
    unwrapBlock(editor, editor.state.doc.child(0).nodeSize);
    expect(texts(editor)).toEqual(["before", "one", "two", "after"]);
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it("works inside a column, and one undo brings the callout back", () => {
    const editor = make(columns([{ type: "callout", attrs: { color: "neutral", bordered: false }, content: [para("x"), para("y")] }], [para("z")]));
    unwrapBlock(editor, 2);
    expect(editor.getJSON().content![0].content![0].content!.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    editor.commands.undo();
    expect(editor.getJSON().content![0].content![0].content![0].type).toBe("callout");
  });

  it("does nothing to a block that holds nothing", () => {
    const editor = make({ type: "divider" });
    expect(unwrapBlock(editor, 0)).toBeNull();
  });
});
