import { act, render, waitFor } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CodeEditor } from "./CodeEditor";
import type { CodeEditorProps } from "./CodeEditor";
import { env, installDomPolyfills } from "./testing";

beforeAll(installDomPolyfills);

const code = `function Example() {
  return (
    <Box gap="2x">
      <Button variant="primary">Save</Button>
    </Box>
  );
}`;

const editor = (props: Partial<CodeEditorProps> = {}) => {
  const result = render(<CodeEditor aria-label="Example code" value={code} {...props} />);
  const dom = result.container.querySelector<HTMLElement>(".cm-editor")!;
  const view = EditorView.findFromDOM(dom)!;
  return { ...result, view, dom };
};
const typeAtEnd = (view: EditorView, text: string) =>
  act(async () => view.dispatch({ changes: { from: view.state.doc.length, insert: text }, selection: { anchor: view.state.doc.length + text.length }, userEvent: "input.type" }));

describe("CodeEditor", () => {
  it("shows the code, with line numbers, as a named multi-line text field", () => {
    const { container, dom } = editor();
    expect(container.querySelectorAll(".cm-line")).toHaveLength(7);
    expect(container.querySelector(".cm-content")?.getAttribute("aria-label")).toBe("Example code");
    expect(container.querySelector(".cm-content")?.getAttribute("aria-multiline")).toBe("true");
    expect(dom.querySelector(".cm-lineNumbers")?.textContent).toContain("7");
  });

  it("is not editable when read only", () => {
    const { container } = editor({ readOnly: true });
    expect(container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("false");
    expect(editor({ readOnly: false }).container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("true");
  });

  it("can be made read only and editable again", () => {
    const { container, rerender } = editor();
    rerender(<CodeEditor aria-label="Example code" value={code} readOnly />);
    expect(container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("false");
    rerender(<CodeEditor aria-label="Example code" value={code} />);
    expect(container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("true");
  });

  describe("the text", () => {
    it("is reported as it is edited", async () => {
      const onChange = vi.fn();
      const { view } = editor({ onChange });
      await typeAtEnd(view, "\n// done");
      expect(onChange).toHaveBeenLastCalledWith(`${code}\n// done`);
    });

    it("is replaced when a new value comes in, without that being reported back as an edit", () => {
      const onChange = vi.fn();
      const { view, rerender } = editor({ onChange });
      rerender(<CodeEditor aria-label="Example code" value="const a = 1;" onChange={onChange} />);
      expect(view.state.doc.toString()).toBe("const a = 1;");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("is left alone when the value it is given is the text it already has", () => {
      const { view, rerender } = editor();
      const doc = view.state.doc;
      rerender(<CodeEditor aria-label="Example code" value={code} />);
      expect(view.state.doc).toBe(doc);
    });
  });

  describe("marking from outside", () => {
    const range = (line: number, from: number, to: number) => ({ from: { line, column: from }, to: { line, column: to } });

    it("marks the piece, and the row it is on, and clears it again", () => {
      const { container, rerender } = editor({ marked: { ranges: [range(4, 6, 45)] } });
      expect(container.querySelector(".cm-marked")?.textContent).toBe('<Button variant="primary">Save</Button>');
      expect(container.querySelectorAll(".cm-marked-line")).toHaveLength(1);
      rerender(<CodeEditor aria-label="Example code" value={code} marked={null} />);
      expect(container.querySelector(".cm-marked")).toBeNull();
      expect(container.querySelector(".cm-marked-line")).toBeNull();
    });

    it("follows the lines the document shows, when it shows only part of a file", () => {
      // The document's line 4 is line 14 of the file.
      const lineOf = (file: number) => (file >= 11 && file <= 17 ? file - 10 : null);
      const { container } = editor({ marked: { ranges: [range(14, 6, 45)], lineOf } });
      expect(container.querySelector(".cm-marked")?.textContent).toBe('<Button variant="primary">Save</Button>');
    });

    it("moves the mark when another part is pointed at", () => {
      const { container, rerender } = editor({ marked: { ranges: [range(3, 4, 18)] } });
      expect(container.querySelector(".cm-marked")?.textContent).toBe('<Box gap="2x">');
      rerender(<CodeEditor aria-label="Example code" value={code} marked={{ ranges: [range(4, 6, 45)] }} />);
      expect(container.querySelectorAll(".cm-marked")).toHaveLength(1);
      expect(container.querySelector(".cm-marked")?.textContent).toContain("Button");
    });
  });

  describe("the element the cursor is in", () => {
    const at = (needle: string, offset = 0) => code.indexOf(needle) + offset;

    it("is reported when the cursor moves into one, and when it moves out", () => {
      const onCursorElement = vi.fn();
      const { view } = editor({ onCursorElement });
      act(() => view.dispatch({ selection: { anchor: at("variant", 2) } }));
      expect(onCursorElement).toHaveBeenLastCalledWith(expect.objectContaining({ tag: "Button" }));
      act(() => view.dispatch({ selection: { anchor: at("function", 2) } }));
      expect(onCursorElement).toHaveBeenLastCalledWith(null);
    });

    it("is reported once while the cursor stays in the same element", () => {
      const onCursorElement = vi.fn();
      const { view } = editor({ onCursorElement });
      act(() => view.dispatch({ selection: { anchor: at("variant", 1) } }));
      act(() => view.dispatch({ selection: { anchor: at("variant", 4) } }));
      act(() => view.dispatch({ selection: { anchor: at("primary", 2) } }));
      expect(onCursorElement).toHaveBeenCalledTimes(1);
    });

    it("tells apart the elements that contain one another", () => {
      const onCursorElement = vi.fn();
      const { view } = editor({ onCursorElement });
      act(() => view.dispatch({ selection: { anchor: at("gap", 1) } }));
      expect(onCursorElement).toHaveBeenLastCalledWith(expect.objectContaining({ tag: "Box" }));
      act(() => view.dispatch({ selection: { anchor: at("variant", 1) } }));
      expect(onCursorElement).toHaveBeenLastCalledWith(expect.objectContaining({ tag: "Button" }));
    });
  });

  describe("a suggestion from outside", () => {
    it("is shown ahead of the cursor after you type, and Tab writes it in", async () => {
      const suggest = vi.fn(async () => " // suggested");
      const onChange = vi.fn();
      const { view, container } = editor({ suggest, onChange });
      await typeAtEnd(view, "\nconst a = 1;");
      await waitFor(() => expect(container.querySelector(".cm-ghost")?.textContent).toBe(" // suggested"));
      act(() => void container.querySelector(".cm-content")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
      expect(view.state.doc.toString().endsWith("const a = 1; // suggested")).toBe(true);
      expect(container.querySelector(".cm-ghost")).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(view.state.doc.toString());
    });

    it("is dropped by Escape, leaving the text as it was", async () => {
      const { view, container } = editor({ suggest: async () => " nope" });
      await typeAtEnd(view, "x");
      await waitFor(() => expect(container.querySelector(".cm-ghost")).not.toBeNull());
      act(() => void container.querySelector(".cm-content")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
      expect(container.querySelector(".cm-ghost")).toBeNull();
      expect(view.state.doc.toString().endsWith("x")).toBe(true);
    });

    it("uses the suggester it has now, not the one it had when it was made", async () => {
      const first = vi.fn(async () => " first");
      const second = vi.fn(async () => " second");
      const { view, container, rerender } = editor({ suggest: first });
      rerender(<CodeEditor aria-label="Example code" value={code} suggest={second} />);
      await typeAtEnd(view, "y");
      await waitFor(() => expect(container.querySelector(".cm-ghost")?.textContent).toBe(" second"));
      expect(first).not.toHaveBeenCalled();
    });
  });

  it("is coloured by Cuboid's syntax colours, by the names it shares with CodeBlock", () => {
    editor();
    const styles = [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
    for (const name of ["cs-keyword", "cs-componentTag", "cs-jsxAttribute", "cs-string"]) expect(styles, name).toContain(name);
  });

  it("puts those names on what it draws", () => {
    const { container } = editor();
    expect(container.querySelector(".cs-storage")?.textContent).toBe("function");
    expect(container.querySelector(".cs-keyword")?.textContent).toBe("return");
    expect([...container.querySelectorAll(".cs-componentTag")].map((el) => el.textContent)).toContain("Box");
    expect(container.querySelector(".cs-jsxAttribute")?.textContent).toBe("gap");
  });

  it("colours brackets by depth and a tag's angle brackets like the tag, on what it draws", () => {
    const { container } = editor();
    expect(container.querySelector(".cs-bracketLevel1")).not.toBeNull();
    expect(container.querySelector(".cs-bracketLevel2")).not.toBeNull();
    expect([...container.querySelectorAll(".cs-componentTag")].some((el) => el.textContent === "<")).toBe(true);
  });

  it("gives the line numbers the editor's own surface, so code scrolled sideways does not show through them and the two are never different colours", () => {
    const styles = [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
    editor();
    const all = styles + [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
    expect(all).toMatch(/\.cm-gutters[^}]*background-color:\s*var\(--editor-surface/);
    // The editor itself (`&` in a theme is a generated class), on the same variable.
    expect(all).toMatch(/background-color:\s*var\(--editor-surface,\s*transparent\)/);
  });

  it("takes its surface from where it sits: a well on the pane, or the pane itself", () => {
    const { container, rerender } = render(<CodeEditor readOnly value="a" aria-label="x" />);
    const host = () => container.querySelector<HTMLElement>('[data-component="Shell.CodeEditor"]')!;
    expect(host().style.getPropertyValue("--editor-surface")).toBe("var(--cube-bgColor-canvas-subtle)");
    rerender(<CodeEditor readOnly surface="default" value="a" aria-label="x" />);
    expect(host().style.getPropertyValue("--editor-surface")).toBe("var(--cube-bgColor-canvas-default)");
  });

  it("is destroyed with its component, leaving nothing behind", () => {
    const { container, unmount } = editor();
    unmount();
    expect(container.querySelector(".cm-editor")).toBeNull();
  });

  it("takes the components it suggests from", () => {
    // The wiring, not the list: the list is tested with the completions.
    expect(() => editor({ env })).not.toThrow();
  });
});
