import { act } from "react";
import { createRoot } from "react-dom/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import type { DocNode } from "../../core";
import { turnInto } from "../../write/blockCommands";
import { BLOCK_TYPES } from "../../write/blockTypes";
import { extensionsFor } from "../../write/extensions";

let editor: Editor;
afterEach(() => editor?.destroy());

const code = (value: string, language = "text"): DocNode => ({ type: "codeBlock", attrs: { language }, content: value ? [{ type: "text", text: value }] : [] });

async function mount(...blocks: DocNode[]) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: blocks } });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
}

describe("code block", () => {
  it("keeps its text, newlines and language as plain JSON", async () => {
    await mount(code("a\n  b", "typescript"));
    expect(editor.getJSON().content![0]).toEqual({ type: "codeBlock", attrs: { language: "typescript" }, content: [{ type: "text", text: "a\n  b" }] });
  });

  it("names its language, and changes it from a menu", async () => {
    await mount(code("x"));
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Language: Plain text" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "TypeScript" }));
    expect(editor.getJSON().content![0].attrs).toEqual({ language: "typescript" });
    expect(screen.getByRole("button", { name: "Language: TypeScript" })).toBeInTheDocument();
  });

  it("checks the current language in the menu", async () => {
    await mount(code("x", "css"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Language: CSS" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "CSS" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Plain text" })).toHaveAttribute("aria-checked", "false");
  });

  it("takes Enter as a newline, not a new block", async () => {
    await mount(code("ab"));
    editor.commands.setTextSelection(2);
    await act(async () => void editor.commands.keyboardShortcut("Enter"));
    expect(editor.getJSON().content).toHaveLength(1);
    expect(editor.getJSON().content![0].content![0].text).toBe("a\nb");
  });

  it("drops marks when text becomes code, since code carries none", async () => {
    await mount({ type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] });
    turnInto(editor, 0, BLOCK_TYPES.find((t) => t.value === "codeBlock")!);
    expect(editor.getJSON().content![0]).toMatchObject({ type: "codeBlock", content: [{ type: "text", text: "bold" }] });
    expect(editor.getJSON().content![0].content![0].marks).toBeUndefined();
  });

  it("is allowed in a column", async () => {
    await mount({ type: "columns", content: [{ type: "column", content: [code("a")] }, { type: "column", content: [{ type: "paragraph" }] }] });
    expect(() => editor.state.doc.check()).not.toThrow();
  });
});
