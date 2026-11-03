import { act } from "react";
import { createRoot } from "react-dom/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import type { DocNode } from "../../core";
import { extensionsFor } from "../extensions";

const para = (value: string): DocNode => ({ type: "paragraph", content: [{ type: "text", text: value }] });
const columnsDoc = (count: number): DocNode => ({
  type: "doc",
  content: [{ type: "columns", content: Array.from({ length: count }, (_, i) => ({ type: "column", content: [para(`col ${i + 1}`)] })) }],
});

// jsdom has no layout. Give each column 300px and a 40px gap, in order, so the view has boxes to measure.
const GAP = 40;
const WIDTH = 300;
const index = (el: HTMLElement) => Array.from(el.parentElement?.children ?? []).indexOf(el);
Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get() { return (this as HTMLElement).hasAttribute("data-column") ? WIDTH : 0; } });
Object.defineProperty(HTMLElement.prototype, "offsetLeft", { configurable: true, get() { return (this as HTMLElement).hasAttribute("data-column") ? index(this as HTMLElement) * (WIDTH + GAP) : 0; } });

let editor: Editor;
const mount = async (doc: DocNode) => {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: doc });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
};
afterEach(() => editor?.destroy());

const flexes = () => editor.getJSON().content![0].content!.map((c) => c.attrs!.flex as number);

describe("columns", () => {
  it("puts a divider between each pair of columns, as a keyboard-operable separator", async () => {
    await mount(columnsDoc(3));
    const separators = screen.getAllByRole("separator");
    expect(separators.map((s) => s.getAttribute("aria-label"))).toEqual(["Resize column 1", "Resize column 2"]);
    expect(separators[0]).toHaveAttribute("aria-orientation", "vertical");
    expect(separators[0]).toHaveAttribute("aria-valuenow");
    expect(separators[0]).toHaveAttribute("tabindex", "0");
  });

  it("has no divider for a single column's worth of nothing, and one fewer than the columns", async () => {
    await mount(columnsDoc(2));
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });

  it("resizes with the arrow keys, taking from the neighbour, and saves each press", async () => {
    await mount(columnsDoc(2));
    expect(flexes()).toEqual([1, 1]);
    screen.getByRole("separator").focus();
    await act(async () => userEvent.setup().keyboard("{ArrowRight}"));
    const [first, second] = flexes();
    expect(first).toBeGreaterThan(1);
    expect(second).toBeLessThan(1);
    expect(first + second).toBeCloseTo(2);
  });

  it("never lets a column shrink below its minimum width", async () => {
    await mount(columnsDoc(2));
    screen.getByRole("separator").focus();
    const user = userEvent.setup();
    for (let i = 0; i < 40; i++) await act(async () => user.keyboard("{ArrowLeft}"));
    const [first, second] = flexes();
    // 96px of a 600px pair is 16%: the left column keeps at least that share.
    expect(first / (first + second)).toBeGreaterThanOrEqual(0.15);
  });

  it("one undo puts a resized column back", async () => {
    await mount(columnsDoc(2));
    screen.getByRole("separator").focus();
    await act(async () => userEvent.setup().keyboard("{ArrowRight}"));
    expect(flexes()).not.toEqual([1, 1]);
    await act(async () => void editor.commands.undo());
    expect(flexes()).toEqual([1, 1]);
  });
});
