import { act } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Editor } from "@tiptap/core";
import { makeEditor } from "../../test/makeEditor";
import { extensionsFor } from "../extensions";
import { SlashCommand } from "./slash";

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
const press = (editor: Editor, key: string) =>
  act(async () => {
    editor.view.someProp("handleKeyDown", (handler) => handler(editor.view, new KeyboardEvent("keydown", { key })));
  });
const type = (editor: Editor, text: string) => act(async () => void editor.chain().focus().insertContent(text).run());
const options = () => screen.queryAllByRole("option").map((o) => o.textContent);

const setup = () => makeEditor(emptyDoc, [...extensionsFor(), SlashCommand]);

describe("the / menu", () => {
  it("opens on /, lists every type grouped, and filters as you type", async () => {
    const editor = setup();
    await type(editor, "/");
    expect(screen.getByRole("listbox", { name: "Insert a block" })).toBeInTheDocument();
    expect(options()).toContain("Heading 1");
    expect(within(screen.getByRole("group", { name: "Basic Blocks" })).getAllByRole("option").length).toBeGreaterThan(3);
    expect(screen.getByRole("group", { name: "Layout" })).toBeInTheDocument();

    await type(editor, "head");
    expect(options()).toEqual(["Heading 1", "Heading 2", "Heading 3", "Heading 4", "Heading 5", "Heading 6"]);
  });

  it("says so when nothing matches", async () => {
    const editor = setup();
    await type(editor, "/zzzz");
    expect(options()).toEqual(["No results"]);
  });

  it("moves with the arrow keys, wrapping, while the editor keeps focus and points at the active option", async () => {
    const editor = setup();
    await type(editor, "/head");
    expect(document.querySelector('[data-active]')?.textContent).toBe("Heading 1");
    expect(editor.view.dom.getAttribute("aria-activedescendant")).toBe(document.querySelector("[data-active]")?.id);
    await press(editor, "ArrowDown");
    expect(document.querySelector("[data-active]")?.textContent).toBe("Heading 2");
    await press(editor, "ArrowUp");
    await press(editor, "ArrowUp");
    // Up from the first wraps to the last: there are six headings.
    expect(document.querySelector("[data-active]")?.textContent).toBe("Heading 6");
    expect(editor.view.dom.getAttribute("aria-expanded")).toBe("true");
  });

  it("Enter applies the active type, removes the /query, and one undo reverses it all", async () => {
    const editor = setup();
    await type(editor, "/head");
    await press(editor, "ArrowDown");
    await press(editor, "Enter");
    expect(editor.getJSON().content).toEqual([{ type: "heading", attrs: { level: 2 } }]);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(editor.view.dom.hasAttribute("aria-expanded")).toBe(false);
    await act(async () => void editor.commands.undo());
    expect(editor.getJSON().content![0].type).toBe("paragraph");
  });

  it("picks with the pointer too", async () => {
    const editor = setup();
    await type(editor, "/");
    await act(async () => userEvent.setup().click(screen.getByRole("option", { name: "Callout" })));
    expect(editor.getJSON().content![0].type).toBe("callout");
  });

  it("inserts a block that is not a conversion, such as two columns", async () => {
    const editor = setup();
    await type(editor, "/columns");
    await press(editor, "Enter");
    expect(editor.getJSON().content!.some((n) => n.type === "columns" && n.content!.length === 2)).toBe(true);
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it("inserts a table, with the cursor in its first cell", async () => {
    const editor = setup();
    await type(editor, "/table");
    await press(editor, "Enter");
    expect(editor.state.doc.firstChild!.type.name).toBe("table");
    expect(editor.state.selection.$from.parent.type.name).toBe("tableHeader");
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it("offers only what goes inside a line when typed in a table cell: dates and pills, no blocks", async () => {
    const cellDoc = { type: "doc", content: [{ type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell" }] }] }] };
    const editor = makeEditor(cellDoc, [...extensionsFor(), SlashCommand]);
    await act(async () => void editor.commands.setTextSelection(4));
    await type(editor, "/");
    expect(options()).toEqual(["Date", "Pill"]);
  });

  it("closes without choosing when the / is deleted", async () => {
    const editor = setup();
    await type(editor, "/");
    expect(screen.queryByRole("listbox")).not.toBeNull();
    await act(async () => void editor.commands.deleteRange({ from: 1, to: 2 }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
