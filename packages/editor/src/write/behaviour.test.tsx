import { act } from "react";
import { createRoot } from "react-dom/client";
import { render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import type { DocNode } from "../core";
import { Read } from "../read/Read";
import { extensionsFor } from "./extensions";
import { SlashCommand } from "./slash";

let editor: Editor;
afterEach(() => editor?.destroy());

const para = (value = ""): DocNode => (value ? { type: "paragraph", content: [{ type: "text", text: value }] } : { type: "paragraph" });

async function mount(doc: DocNode, extra: unknown[] = []) {
  const host = document.createElement("div");
  document.body.append(host);
  editor = new Editor({ extensions: [...extensionsFor(), ...extra] as never, content: doc });
  await act(async () => createRoot(host).render(<EditorContent editor={editor} />));
  return host;
}
const at = (fn: () => void) => act(async () => fn());

describe("what an empty block says", () => {
  it("tells you how to start in the block you are in, and only that one", async () => {
    const host = await mount({ type: "doc", content: [para(), para("text"), para()] });
    await at(() => void editor.commands.setTextSelection(1));
    const placeholders = [...host.querySelectorAll("p[data-placeholder]")];
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0].getAttribute("data-placeholder")).toBe("Press / for menu or type");
  });

  it("says Heading in a heading, List item in a list and Quote in a quote", async () => {
    const host = await mount({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 2 } }, { type: "bulletList", content: [{ type: "listItem", content: [para()] }] }, { type: "blockquote", content: [para()] }],
    });
    const said = async (pos: number) => {
      await at(() => void editor.commands.setTextSelection(pos));
      // The list around an empty item is "empty" too, so look at the block that holds the caret.
      return host.querySelector("p[data-placeholder], h2[data-placeholder]")?.getAttribute("data-placeholder");
    };
    expect(await said(1)).toBe("Heading");
    const list = editor.state.doc.child(0).nodeSize;
    expect(await said(list + 3)).toBe("List item");
    const quote = list + editor.state.doc.child(1).nodeSize;
    expect(await said(quote + 2)).toBe("Quote");
  });
});

describe("the / query", () => {
  it("is marked while it is typed, so its block can take the inset surface", async () => {
    const host = await mount({ type: "doc", content: [para()] }, [SlashCommand]);
    await at(() => void editor.chain().focus().insertContent("/head").run());
    expect(host.querySelector(".cuboid-slash")?.textContent).toBe("/head");
    await at(() => void editor.commands.deleteRange({ from: 1, to: 6 }));
    expect(host.querySelector(".cuboid-slash")).toBeNull();
  });
});

describe("a callout takes content", () => {
  const callout = (...content: DocNode[]): DocNode => ({ type: "callout", attrs: { color: "blue", bordered: false }, content });

  it("takes another block when you press Enter at the end of its text", async () => {
    await mount({ type: "doc", content: [callout(para("one"))] });
    await at(() => void editor.commands.setTextSelection(4));
    await at(() => void editor.commands.keyboardShortcut("Enter"));
    expect(editor.getJSON().content).toHaveLength(1);
    expect(editor.getJSON().content![0].content).toHaveLength(2);
  });

  it("takes a heading, a list and code, not only paragraphs", async () => {
    await mount({
      type: "doc",
      content: [callout(para("a"), { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "h" }] }, { type: "bulletList", content: [{ type: "listItem", content: [para("li")] }] }, { type: "codeBlock", content: [{ type: "text", text: "x" }] })],
    });
    expect(() => editor.state.doc.check()).not.toThrow();
  });

  it("lets you out: Enter on an empty last line leaves the callout", async () => {
    await mount({ type: "doc", content: [callout(para("one"), para())] });
    await at(() => void editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 2));
    await at(() => void editor.commands.keyboardShortcut("Enter"));
    const blocks = editor.getJSON().content!;
    expect(blocks.map((b) => b.type)).toEqual(["callout", "paragraph"]);
    expect(blocks[0].content).toHaveLength(1);
  });

  it("opens the / menu inside it", async () => {
    await mount({ type: "doc", content: [callout(para())] }, [SlashCommand]);
    await at(() => void editor.chain().focus().setTextSelection(2).insertContent("/").run());
    expect(screen.getByRole("listbox", { name: "Insert a block" })).toBeInTheDocument();
  });
});

describe("Read and the editor share one look", () => {
  it("draws a document inside the same prose surface the editor uses", () => {
    const { container } = render(<Read node={{ type: "doc", content: [para("x")] }} />);
    expect(container.querySelector('[data-component="Read"]')?.className).toContain("Prose");
  });
});
