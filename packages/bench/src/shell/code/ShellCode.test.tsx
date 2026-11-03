import { act, render, waitFor } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import type { ExampleCode } from "../anatomy/exampleSource";
import { AnatomyCode, PlaygroundCode } from "./ShellCode";
import { installDomPolyfills } from "./testing";

beforeAll(installDomPolyfills);

const example = (code = 'function Example() {\n  return <Button variant="primary">Save</Button>;\n}'): ExampleCode => ({
  name: "Default",
  code,
  // Lines 1 to 3 of the example are lines 20 to 22 of its file; a line made here (an import) has none.
  lineMap: code.split("\n").map((_, i) => 20 + i),
});
const viewOf = (container: HTMLElement) => EditorView.findFromDOM(container.querySelector<HTMLElement>(".cm-editor")!)!;
const range = (line: number, from: number, to: number) => ({ from: { line, column: from }, to: { line, column: to } });

describe("AnatomyCode", () => {
  it("shows the example read only, named for it", () => {
    const { container } = render(<AnatomyCode example={example()} hover={null} />);
    expect(container.querySelector(".cm-content")?.getAttribute("aria-label")).toBe("Example code: Default");
    expect(container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("false");
  });

  it("marks the piece the part under the pointer was written as, by the line it has in the file", () => {
    const { container, rerender } = render(<AnatomyCode example={example()} hover={null} />);
    expect(container.querySelector(".cm-marked")).toBeNull();
    // The file's line 21 is the document's line 2.
    rerender(<AnatomyCode example={example()} hover={[range(21, 9, 48)]} />);
    expect(container.querySelector(".cm-marked")?.textContent).toBe('<Button variant="primary">Save</Button>');
    rerender(<AnatomyCode example={example()} hover={null} />);
    expect(container.querySelector(".cm-marked")).toBeNull();
  });

  it("marks nothing for a piece of the file the example does not show", () => {
    const { container } = render(<AnatomyCode example={example()} hover={[range(5, 0, 10)]} />);
    expect(container.querySelector(".cm-marked")).toBeNull();
  });
});

describe("PlaygroundCode", () => {
  it("is editable, and says which element the cursor is in", async () => {
    const { container, queryByText } = render(<PlaygroundCode example={example()} />);
    expect(container.querySelector(".cm-content")?.getAttribute("contenteditable")).toBe("true");
    expect(queryByText(/Not in an element/)).not.toBeNull();
    const view = viewOf(container);
    await act(async () => view.dispatch({ selection: { anchor: view.state.doc.toString().indexOf("variant") + 2 } }));
    expect(queryByText(/In <Button>/)).not.toBeNull();
  });

  it("suggests the next prop a component requires, from its model, and Tab writes it in", async () => {
    const { container } = render(<PlaygroundCode example={example("const a = <IconButton")} />);
    const view = viewOf(container);
    await act(async () => view.dispatch({ changes: { from: view.state.doc.length, insert: " " }, selection: { anchor: view.state.doc.length + 1 }, userEvent: "input.type" }));
    await waitFor(() => expect(container.querySelector(".cm-ghost")?.textContent).toBeTruthy());
    const suggestion = container.querySelector(".cm-ghost")!.textContent!;
    act(() => void container.querySelector(".cm-content")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
    expect(view.state.doc.toString()).toBe(`const a = <IconButton ${suggestion}`);
  });

  it("starts again from a different example, and keeps what was typed while it is the same one", async () => {
    const { container, rerender } = render(<PlaygroundCode example={example("const a = 1;")} />);
    const view = viewOf(container);
    await act(async () => view.dispatch({ changes: { from: view.state.doc.length, insert: "\nconst b = 2;" }, userEvent: "input.type" }));
    rerender(<PlaygroundCode example={example("const a = 1;")} />);
    expect(view.state.doc.toString()).toBe("const a = 1;\nconst b = 2;");
    rerender(<PlaygroundCode example={example("const c = 3;")} />);
    await waitFor(() => expect(view.state.doc.toString()).toBe("const c = 3;"));
  });
});
