import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import type { DocNode } from "../../../core";
import { extensionsFor } from "../../../write/extensions";
import { EditorSurface } from "../EditorSurface";

let editor: Editor;
afterEach(() => editor?.destroy());

const doc = (...content: DocNode[]): DocNode => ({ type: "doc", content: [{ type: "paragraph", content }] });
const text = (value: string, marks?: DocNode["marks"]): DocNode => ({ type: "text", text: value, marks });

function mount(content: DocNode = doc(text("hello world"))) {
  editor = new Editor({ extensions: extensionsFor(), content });
  render(<EditorSurface editor={editor} />);
  return editor;
}
const select = (from: number, to: number) =>
  act(async () => {
    editor.view.focus();
    editor.commands.setTextSelection({ from, to });
  });
const toolbar = () => screen.queryByRole("toolbar", { name: "Text formatting" });
const marksOnSelection = () => {
  const found: Record<string, unknown>[] = [];
  editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, (node) => void node.marks.forEach((m) => found.push({ type: m.type.name, ...m.attrs })));
  return found;
};

describe("the selection toolbar", () => {
  it("shows for a selection of text, and goes when the selection collapses", async () => {
    mount();
    await select(3, 3);
    expect(toolbar()).toBeNull();
    await select(1, 6);
    expect(toolbar()).not.toBeNull();
    await select(6, 6);
    expect(toolbar()).toBeNull();
  });

  it("does not show when the editor is not focused", async () => {
    mount();
    await act(async () => void editor.commands.setTextSelection({ from: 1, to: 6 }));
    editor.view.dom.blur();
    await act(async () => void editor.commands.setTextSelection({ from: 1, to: 7 }));
    expect(toolbar()).toBeNull();
  });

  it.each([["Bold", "bold"], ["Italic", "italic"], ["Underline", "underline"], ["Code", "code"]])("toggles %s on the selection", async (name, mark) => {
    mount();
    await select(1, 6);
    const button = within(toolbar()!).getByRole("button", { name });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.setup().click(button);
    expect(marksOnSelection().map((m) => m.type)).toContain(mark);
    expect(within(toolbar()!).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    await userEvent.setup().click(within(toolbar()!).getByRole("button", { name }));
    expect(marksOnSelection().map((m) => m.type)).not.toContain(mark);
  });

  it("reflects marks already on the text", async () => {
    mount(doc(text("hello world", [{ type: "bold" }])));
    await select(1, 6);
    expect(within(toolbar()!).getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(within(toolbar()!).getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not take the selection out of the editor when a button is pressed", async () => {
    mount();
    await select(1, 6);
    const notPrevented = fireEvent.mouseDown(within(toolbar()!).getByRole("button", { name: "Bold" }));
    expect(notPrevented).toBe(false);
  });

  it("has the portfolio's buttons in its order, and no more", async () => {
    mount();
    await select(1, 6);
    const names = ["Text colour", "Highlight", "Chip", "Bold", "Italic", "Underline", "Code", "Link", "Close"];
    const buttons = within(toolbar()!).getAllByRole("button");
    expect(buttons).toHaveLength(names.length);
    // Each button is where the portfolio puts it: its position among the buttons is its position in the list.
    expect(names.map((name) => buttons.indexOf(within(toolbar()!).getByRole("button", { name })))).toEqual(names.map((_, i) => i));
  });

  it("sets a text colour from a flat grid of A tiles, and takes it off by choosing the default", async () => {
    mount();
    await select(1, 6);
    const user = userEvent.setup();
    await user.click(within(toolbar()!).getByRole("button", { name: "Text colour" }));
    const panel = await screen.findByRole("dialog", { name: "Text colour" });
    // No search, no headings: rows of tiles, each an A in its colour.
    expect(within(panel).queryByRole("textbox")).toBeNull();
    expect(within(panel).queryByText("Neutral")).toBeNull();
    expect(within(panel).getAllByRole("radio")[0]).toHaveTextContent("A");
    expect(within(panel).getAllByRole("radio")[0]).toHaveAttribute("data-appearance", "text");
    await user.click(within(panel).getByRole("radio", { name: "Danger" }));
    expect(marksOnSelection()).toContainEqual({ type: "textColor", color: "danger.strong" });
    expect(toolbar()).not.toBeNull();

    await user.click(within(toolbar()!).getByRole("button", { name: "Text colour" }));
    await user.click(await screen.findByRole("radio", { name: "Default" }));
    expect(marksOnSelection().map((m) => m.type)).not.toContain("textColor");
  });

  it("highlights from a grid of A tiles on the colour, and takes it off with the no-colour tile", async () => {
    mount();
    await select(1, 6);
    const user = userEvent.setup();
    await user.click(within(toolbar()!).getByRole("button", { name: "Highlight" }));
    // The first tile is the no-colour one; the colours after it are drawn as highlights.
    expect((await screen.findAllByRole("radio"))[1]).toHaveAttribute("data-appearance", "highlight");
    await user.click(screen.getByRole("radio", { name: "Blue" }));
    expect(marksOnSelection()).toContainEqual({ type: "highlight", color: "blue" });
    await user.click(within(toolbar()!).getByRole("button", { name: "Highlight" }));
    await user.click(await screen.findByRole("radio", { name: "None" }));
    expect(marksOnSelection().map((m) => m.type)).not.toContain("highlight");
  });

  it("makes the selected text a chip: a mark on the text, not a pill in its place", async () => {
    mount();
    await select(1, 6);
    const user = userEvent.setup();
    const button = within(toolbar()!).getByRole("button", { name: "Chip" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(editor.getJSON().content![0].content![0]).toEqual({ type: "text", text: "hello", marks: [{ type: "chip" }] });
    expect(editor.getJSON().content![0].content!.some((n) => n.type === "pill")).toBe(false);
    expect(screen.queryByRole("dialog", { name: "Pill" })).toBeNull();
    expect(within(toolbar()!).getByRole("button", { name: "Chip" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(toolbar()!).getByRole("button", { name: "Chip" }));
    expect(marksOnSelection().map((m) => m.type)).not.toContain("chip");
  });

  it("lets the text of a chip take a colour", async () => {
    mount();
    await select(1, 6);
    const user = userEvent.setup();
    await user.click(within(toolbar()!).getByRole("button", { name: "Chip" }));
    await user.click(within(toolbar()!).getByRole("button", { name: "Text colour" }));
    await user.click(await screen.findByRole("radio", { name: "Danger" }));
    expect(marksOnSelection().map((m) => m.type).sort()).toEqual(["chip", "textColor"]);
  });

  it("closes with its Close button, letting go of the selection", async () => {
    mount();
    await select(1, 6);
    await userEvent.setup().click(within(toolbar()!).getByRole("button", { name: "Close" }));
    expect(editor.state.selection.empty).toBe(true);
    expect(toolbar()).toBeNull();
  });

  describe("links", () => {
    const openLink = async () => {
      const user = userEvent.setup();
      await user.click(within(toolbar()!).getByRole("button", { name: "Link" }));
      return { user, field: await screen.findByRole("textbox", { name: "Link" }) };
    };

    it("links the selection, taking a bare domain to mean https", async () => {
      mount();
      await select(1, 6);
      const { user, field } = await openLink();
      await user.type(field, "example.com");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(marksOnSelection()).toContainEqual(expect.objectContaining({ type: "link", href: "https://example.com" }));
    });

    it("shows the selected text and replaces it when the text is changed, linked", async () => {
      mount();
      await select(1, 6);
      const { user, field } = await openLink();
      const text = screen.getByRole("textbox", { name: "Text" });
      expect(text).toHaveValue("hello");
      await user.clear(text);
      await user.type(text, "the docs");
      await user.type(field, "example.com");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      const [linked, rest] = editor.getJSON().content![0].content!;
      expect(linked).toMatchObject({ text: "the docs", marks: [{ type: "link", attrs: expect.objectContaining({ href: "https://example.com" }) }] });
      expect(rest).toMatchObject({ text: " world" });
    });

    it("keeps the text as it is when only the address is given", async () => {
      mount();
      await select(1, 6);
      const { user, field } = await openLink();
      await user.type(field, "example.com");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(editor.getJSON().content![0].content![0]).toMatchObject({ text: "hello", marks: [{ type: "link" }] });
    });

    it("refuses an address that would run script, and says why", async () => {
      mount();
      await select(1, 6);
      const { user, field } = await openLink();
      await user.type(field, "javascript:alert(1)");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(marksOnSelection().map((m) => m.type)).not.toContain("link");
      expect(screen.getByText(/web address, an email or a phone link/i)).toBeInTheDocument();
      expect(field).toHaveAttribute("aria-invalid", "true");
    });

    it("applies with Enter, shows the current address when reopened, and removes it", async () => {
      mount();
      await select(1, 6);
      let { user, field } = await openLink();
      await user.type(field, "https://a.example{Enter}");
      expect(marksOnSelection()).toContainEqual(expect.objectContaining({ type: "link", href: "https://a.example" }));

      await select(1, 6);
      ({ user, field } = await openLink());
      expect(field).toHaveValue("https://a.example");
      await user.click(screen.getByRole("button", { name: "Remove" }));
      expect(marksOnSelection().map((m) => m.type)).not.toContain("link");
    });

    it("labels its fields where they can be seen, not only for assistive technology", async () => {
      mount();
      await select(1, 6);
      await openLink();
      const dialog = screen.getByRole("dialog", { name: "Link" });
      const labels = [...dialog.querySelectorAll("label")].map((l) => l.textContent?.trim());
      expect(labels).toEqual(["Text", "Link"]);
      expect(within(dialog).getByRole("textbox", { name: "Text" })).toBeInTheDocument();
      expect(within(dialog).getByRole("textbox", { name: "Link" })).toBeInTheDocument();
    });

    it("keeps the toolbar while the address field has focus", async () => {
      mount();
      await select(1, 6);
      const { field } = await openLink();
      expect(field).toHaveFocus();
      expect(toolbar()).not.toBeNull();
    });
  });

  it("Escape lets go of the selection", async () => {
    mount();
    await select(1, 6);
    await userEvent.setup().click(within(toolbar()!).getByRole("button", { name: "Bold" }));
    fireEvent.keyDown(toolbar()!, { key: "Escape" });
    expect(editor.state.selection.empty).toBe(true);
    expect(toolbar()).toBeNull();
  });
});
