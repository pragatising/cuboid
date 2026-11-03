import { act } from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { render } from "@testing-library/react";
import type { DocNode } from "../../core";
import { Read } from "../../read/Read";
import { BLOCK_TYPES } from "../blockTypes";
import { extensionsFor } from "../extensions";
import { MAX_TABLE_COLUMNS as MAX_COLUMNS } from "../../constants";
import { addColumn, addRow, removeColumn, removeRow, toggleHeaderRowOf } from "./index";

let editor: Editor;
afterEach(() => {
  editor?.destroy();
  document.body.innerHTML = "";
});

const text = (value: string): DocNode[] => (value ? [{ type: "text", text: value }] : []);
const cell = (value = "", type = "tableCell"): DocNode => ({ type, ...(value ? { content: text(value) } : {}) });
const row = (...values: string[]): DocNode => ({ type: "tableRow", content: values.map((v) => cell(v)) });
const head = (...values: string[]): DocNode => ({ type: "tableRow", content: values.map((v) => cell(v, "tableHeader")) });
const table = (...rows: DocNode[]): DocNode => ({ type: "table", content: rows });
const p = (value = ""): DocNode => ({ type: "paragraph", ...(value ? { content: text(value) } : {}) });

async function mount(...blocks: DocNode[]) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: blocks } });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
  return host;
}
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(async () => void editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })));
const caretIn = (value: string) =>
  act(async () => {
    let at = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === value) at = pos + value.length;
    });
    editor.commands.setTextSelection(at);
  });
/** The table as rows of cell text, to compare the shape without the node noise. */
const grid = (): string[][] => {
  const out: string[][] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tableRow") out.push(node.content.content.map((c) => c.textContent));
    return node.type.name === "table" || node.type.name === "doc" ? true : false;
  });
  return out;
};

describe("table: in the editor", () => {
  it("draws the markup Cuboid's Table rules are written for", async () => {
    const host = await mount(table(head("Name", "Role"), row("Ada", "Dev")));
    const root = host.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.dataset.block).toBe("table");
    expect(root.querySelector('table[data-component="Table"] > tbody[data-component="Table.Body"]')).not.toBeNull();
    expect(root.querySelectorAll('tr[data-component="Table.Row"]')).toHaveLength(2);
    expect(root.querySelectorAll('th[data-component="Table.HeadCell"]')).toHaveLength(2);
    expect(root.querySelectorAll('td[data-component="Table.Cell"]')).toHaveLength(2);
  });

  it("round-trips its document", async () => {
    const doc = table(head("Name", "Role"), row("Ada", "Dev"));
    await mount(doc);
    const json = editor.getJSON().content![0] as DocNode;
    expect(json.type).toBe("table");
    expect(grid()).toEqual([["Name", "Role"], ["Ada", "Dev"]]);
  });

  it("holds inline content in a cell: marks, and nothing nested", async () => {
    await mount(table(row("a")));
    const cellType = editor.schema.nodes.tableCell;
    expect(cellType.spec.content).toBe("inline*");
    expect(cellType.spec.isolating).toBe(true);
    expect(editor.schema.nodes.table.spec.tableRole).toBe("table");
  });
});

describe("table: keys", () => {
  it("Tab goes to the next cell, and from the last one adds a row", async () => {
    await mount(table(row("a", "b"), row("c", "d")));
    await caretIn("a");
    await press("Tab");
    expect(editor.state.selection.$from.parent.textContent).toBe("b");
    await caretIn("d");
    await press("Tab");
    expect(grid()).toHaveLength(3);
    expect(editor.state.selection.$from.parent.textContent).toBe("");
    expect(editor.state.selection.$from.node(-1).childCount).toBe(2);
  });

  it("Shift-Tab goes back, and does nothing in the first cell (it still keeps focus)", async () => {
    await mount(table(row("a", "b")));
    await caretIn("b");
    await press("Tab", { shiftKey: true });
    expect(editor.state.selection.$from.parent.textContent).toBe("a");
    await press("Tab", { shiftKey: true });
    expect(editor.state.selection.$from.parent.textContent).toBe("a");
  });

  it("Enter goes down a cell, and from the last row leaves the table", async () => {
    await mount(table(row("a", "b"), row("c", "d")), p("after"));
    await caretIn("b");
    await press("Enter");
    expect(editor.state.selection.$from.parent.textContent).toBe("d");
    await press("Enter");
    expect(editor.state.selection.$from.parent.textContent).toBe("after");
    expect(grid()).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("Enter from the last row of a table that ends the page adds a paragraph after it", async () => {
    await mount(table(row("a")));
    await caretIn("a");
    await press("Enter");
    expect(editor.state.doc.lastChild?.type.name).toBe("paragraph");
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
  });
});

describe("table: commands", () => {
  it("adds a row and a column beside the cursor", async () => {
    await mount(table(row("a", "b"), row("c", "d")));
    await caretIn("a");
    addRow(editor, "after");
    expect(grid()).toEqual([["a", "b"], ["", ""], ["c", "d"]]);
    addColumn(editor, "before");
    expect(grid()[0]).toEqual(["", "a", "b"]);
  });

  it("does not add a column past the cap", async () => {
    await mount(table({ type: "tableRow", content: Array.from({ length: MAX_COLUMNS }, () => cell("x")) }));
    await caretIn("x");
    expect(addColumn(editor, "after")).toBe(false);
    expect(grid()[0]).toHaveLength(MAX_COLUMNS);
  });

  it("removes the cursor's row and column", async () => {
    await mount(table(row("a", "b"), row("c", "d")));
    await caretIn("a");
    removeRow(editor);
    expect(grid()).toEqual([["c", "d"]]);
    removeColumn(editor);
    expect(grid()).toEqual([["d"]]);
  });

  it("turns the first row into headers and back", async () => {
    await mount(table(row("a", "b"), row("c", "d")));
    await caretIn("a");
    toggleHeaderRowOf(editor);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.type.name).toBe("tableHeader");
    toggleHeaderRowOf(editor);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.type.name).toBe("tableCell");
  });
});

describe("table: the menu", () => {
  const type = BLOCK_TYPES.find((t) => t.value === "table")!;

  it("is listed as a block to insert, not to turn a paragraph into", () => {
    expect(type).toMatchObject({ label: "Table", group: "basic", convert: false });
  });

  it("inserts a table with a header row and puts the cursor in its first cell", async () => {
    await mount(p());
    await act(async () => void type.apply(editor.chain().focus()).run());
    const first = editor.state.doc.firstChild!;
    expect(first.type.name).toBe("table");
    expect(first.firstChild!.firstChild!.type.name).toBe("tableHeader");
    expect(first.childCount).toBe(3);
    expect(editor.state.selection.$from.parent.type.name).toBe("tableHeader");
    expect(editor.state.selection.$from.parent).toBe(first.firstChild!.firstChild);
  });
});

describe("table: read", () => {
  it("draws the same parts as the editor, header cells as header cells", () => {
    const { container } = render(<Read node={{ type: "doc", content: [table(head("Name"), row("Ada"))] }} />);
    expect(container.querySelector('[data-block="table"] [data-component="Table.Root"] table tbody')).not.toBeNull();
    expect(container.querySelector('th[data-component="Table.HeadCell"]')).toHaveTextContent("Name");
    expect(container.querySelector('td[data-component="Table.Cell"]')).toHaveTextContent("Ada");
  });
});
