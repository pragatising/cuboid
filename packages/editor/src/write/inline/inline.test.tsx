import { act } from "react";
import { createRoot } from "react-dom/client";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import type { DocNode } from "../../core";
import { BLOCK_TYPES } from "../blockTypes";
import { extensionsFor } from "../extensions";

let editor: Editor;
afterEach(() => editor?.destroy());

const text = (value: string): DocNode => ({ type: "text", text: value });
const para = (...content: DocNode[]): DocNode => ({ type: "paragraph", content });
const atoms = () => (editor.getJSON().content![0].content ?? []).filter((n) => n.type !== "text");

async function mount(...content: DocNode[]) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: [para(...content)] } });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
}
const typeByValue = (value: string) => BLOCK_TYPES.find((t) => t.value === value)!;
// Inserting is done from the / menu, where the editor already has focus.
const insert = (value: string) =>
  act(async () => {
    editor.view.focus();
    typeByValue(value).apply(editor.chain().focus()).run();
  });

describe("date mention", () => {
  const withDate = [text("Due "), { type: "date", attrs: { iso: "2026-11-12" } }, text(".")] as DocNode[];

  it("shows the day as a chip, formatted for the reader", async () => {
    await mount(...withDate);
    const date = screen.getByRole("button", { name: /Nov 12, 2026|12 Nov 2026/ });
    expect(date).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    // Text that can be pressed, not a pill: no Pill, no icon.
    expect(date.hasAttribute("data-date")).toBe(true);
    expect(date.closest('[data-component="Pill"]')).toBeNull();
    expect(date.querySelector("svg, [data-component=\"Icon\"]")).toBeNull();
  });

  it("opens its editor when selected, and changes the day", async () => {
    await mount(...withDate);
    await userEvent.setup().click(screen.getByRole("button", { name: /2026/ }));
    const field = await screen.findByLabelText("Date", { selector: "input" });
    expect(field).toHaveValue("2026-11-12");
    // The field has a label you can see.
    expect([...document.querySelectorAll("label")].some((l) => l.textContent?.trim() === "Date")).toBe(true);
    fireEvent.change(field, { target: { value: "2026-12-01" } });
    expect(atoms()[0].attrs).toEqual({ iso: "2026-12-01" });
  });

  it("ignores a cleared field rather than storing no date", async () => {
    await mount(...withDate);
    await userEvent.setup().click(screen.getByRole("button", { name: /2026/ }));
    fireEvent.change(await screen.findByLabelText("Date", { selector: "input" }), { target: { value: "" } });
    expect(atoms()[0].attrs).toEqual({ iso: "2026-11-12" });
  });

  it("puts the caret after it when its editor closes", async () => {
    await mount(...withDate);
    await userEvent.setup().click(screen.getByRole("button", { name: /2026/ }));
    await screen.findByRole("dialog", { name: "Date" });
    await userEvent.setup().keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(editor.state.selection.empty).toBe(true);
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.from + 1)).toBe(".");
  });

  it("is inserted from the / menu with its editor already open", async () => {
    await mount(text("a "));
    editor.commands.setTextSelection(3);
    await insert("date");
    expect(atoms()[0].type).toBe("date");
    expect(await screen.findByRole("dialog", { name: "Date" })).toBeInTheDocument();
  });
});

describe("pill", () => {
  const withPill = [text("Status "), { type: "pill", attrs: { label: "Shipped", shade: "green", intensity: "bold", bordered: false } }] as DocNode[];
  const openEditor = async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: "Shipped" }));
    return screen.findByRole("dialog", { name: "Pill" });
  };

  it("is inserted from the / menu with its editor open and the label ready to type", async () => {
    await mount(text("a "));
    editor.commands.setTextSelection(3);
    await insert("pill");
    expect(atoms()[0]).toMatchObject({ type: "pill", attrs: { label: "Label", shade: "gray" } });
    await waitFor(() => expect(screen.getByLabelText("Label")).toHaveFocus());
  });

  it("changes its label as you type", async () => {
    await mount(...withPill);
    await openEditor();
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Blocked" } });
    expect(atoms()[0].attrs).toMatchObject({ label: "Blocked" });
    expect(screen.getByRole("button", { name: "Blocked" })).toBeInTheDocument();
  });

  it("changes its colour and emphasis from one grid, a row for each emphasis and a column for each colour", async () => {
    await mount(...withPill);
    await openEditor();
    const grid = screen.getByRole("group", { name: "Colour" });
    expect(within(grid).getAllByRole("radiogroup")).toHaveLength(4);
    expect(within(grid).getAllByRole("radio")).toHaveLength(44);
    expect(within(grid).getByRole("radio", { name: "Green bold" })).toHaveAttribute("aria-checked", "true");
    await userEvent.setup().click(within(grid).getByRole("radio", { name: "Blue extra light" }));
    expect(atoms()[0].attrs).toMatchObject({ shade: "blue", intensity: "extraLight" });
    // Choosing in the grid did not close the pill's own editor, and there is no second popup over it.
    expect(screen.getByRole("dialog", { name: "Pill" })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("draws the tiles in the pill's own colours, bordered when it is", async () => {
    await mount(...withPill);
    await openEditor();
    // A light step: where the filled and bordered pill differ (at the dark steps they share a background).
    const filled = screen.getByRole("radio", { name: "Blue light" }).style.getPropertyValue("--swatch");
    await userEvent.setup().click(screen.getByRole("switch", { name: "Border" }));
    expect(atoms()[0].attrs).toMatchObject({ bordered: true });
    expect(screen.getByRole("radio", { name: "Blue light" }).style.getPropertyValue("--swatch")).not.toBe(filled);
  });

  it("is removed when its label is left empty", async () => {
    await mount(...withPill);
    await openEditor();
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "   " } });
    await userEvent.setup().keyboard("{Escape}");
    expect(atoms()).toEqual([]);
  });

  it("stays when closed with a label", async () => {
    await mount(...withPill);
    await openEditor();
    await userEvent.setup().keyboard("{Escape}");
    expect(atoms()).toHaveLength(1);
  });

  it("round-trips as plain JSON", async () => {
    await mount(...withPill);
    expect(atoms()[0]).toEqual(withPill[1]);
  });
});

describe("editing an atom keeps it open", () => {
  it("keeps the pill selected and its editor open through every change, and focus in the field while typing", async () => {
    await mount(text("a "), { type: "pill", attrs: { label: "Hi" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Hi" }));
    const field = await screen.findByLabelText("Label");
    await act(async () => field.focus());
    const user = userEvent.setup();
    await user.type(field, "gh");
    expect(atoms()[0].attrs).toMatchObject({ label: "High" });
    expect(screen.getByRole("dialog", { name: "Pill" })).toBeInTheDocument();
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
    expect(field).toHaveFocus();
  });

  it("is one undo per change, and undo restores the label", async () => {
    await mount({ type: "pill", attrs: { label: "Hi" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Hi" }));
    fireEvent.change(await screen.findByLabelText("Label"), { target: { value: "Bye" } });
    expect(atoms()[0].attrs).toMatchObject({ label: "Bye" });
    await act(async () => void editor.commands.undo());
    expect(atoms()[0].attrs).toMatchObject({ label: "Hi" });
  });
});


describe("chip", () => {
  it("is a mark on text, and round-trips as plain JSON", async () => {
    await mount({ type: "text", text: "something", marks: [{ type: "chip" }] }, text(", they think"));
    expect(editor.getJSON().content![0].content![0]).toEqual({ type: "text", text: "something", marks: [{ type: "chip" }] });
  });

  it("does not continue when you type after it", async () => {
    await mount({ type: "text", text: "something", marks: [{ type: "chip" }] });
    await act(async () => {
      editor.commands.setTextSelection(1 + "something".length);
      editor.commands.insertContent("x");
    });
    const [chip, after] = editor.getJSON().content![0].content!;
    expect(chip.marks).toEqual([{ type: "chip" }]);
    expect(after).toMatchObject({ text: "x" });
    expect(after.marks).toBeUndefined();
  });

  it("toggles with Mod-E", async () => {
    await mount(text("word"));
    await act(async () => void editor.commands.setTextSelection({ from: 1, to: 5 }));
    await act(async () => void editor.commands.keyboardShortcut("Mod-e"));
    expect(editor.getJSON().content![0].content![0].marks).toEqual([{ type: "chip" }]);
  });

  it("is drawn as tall as its line, so a paragraph that has one does not jump", () => {
    const css = readFileSync(resolve(__dirname, "../../styles/Inline.module.css"), "utf8");
    const rule = /\[data-chip\]\s*\{([^}]*)\}/.exec(css)![1];
    expect(rule).toMatch(/line-height:\s*inherit/);
    // A fixed `height:` would set it apart from its line (`line-height` is the other thing, and is what is wanted).
    expect(rule).not.toMatch(/(^|[\s;])height:/);
    expect(rule).toMatch(/display:\s*inline-block/);
  });
});

describe("the pill's colour grid", () => {
  it("fits the popover it is in: its width at the tile size and gap it is drawn with is no more than the popover's limit", () => {
    const cssOf = (path: string) => readFileSync(resolve(__dirname, path), "utf8");
    const grid = cssOf("../../../../react/src/components/core/ColorPicker/SwatchGrid.module.css");
    const px = (name: string) => Number(new RegExp(`${name}:\\s*var\\(--cube-size-(\\d+)px\\)`).exec(grid)![1]);
    const tile = px("width");
    const gap = Number(/\.Row\)\s*\{[^}]*gap:\s*var\(--cube-size-(\d+)px\)/.exec(grid)![1]);
    const tokens = JSON.parse(cssOf("../../../../primitives/dist/tokens.json"));
    const limit = parseFloat((tokens.light ?? tokens).popover.sizes.maxWidth) * 16;
    const columns = 11;
    const padding = 2 * 12; // the panel's "1.5x" on each side
    expect(columns * tile + (columns - 1) * gap + padding).toBeLessThanOrEqual(limit);
  });
});
