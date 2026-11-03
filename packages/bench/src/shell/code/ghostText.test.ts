import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { acceptGhost, dismissGhost, ghostField, ghostText, setGhost } from "./ghostText";
import type { Suggest } from "./ghostText";
import { installDomPolyfills } from "./testing";

beforeAll(installDomPolyfills);

const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((v) => v.destroy()));

function make(doc: string, suggest?: Suggest, delay = 0) {
  const view = new EditorView({ parent: document.body, state: EditorState.create({ doc, selection: { anchor: doc.length }, extensions: [ghostText({ suggest: () => suggest, delay })] }) });
  views.push(view);
  return view;
}
/** Types a character the way a person does (as user input), at the end. */
const type = (view: EditorView, text: string) => view.dispatch({ changes: { from: view.state.doc.length, insert: text }, selection: { anchor: view.state.doc.length + text.length }, userEvent: "input.type" });
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const ghost = (view: EditorView) => view.state.field(ghostField);

describe("the ghost", () => {
  it("is a suggestion ahead of the cursor, drawn apart from the text", () => {
    const view = make("<Button");
    view.dispatch({ effects: setGhost.of({ pos: 7, text: ' variant="primary"' }) });
    expect(view.dom.querySelector(".cm-ghost")?.textContent).toBe(' variant="primary"');
    expect(view.dom.querySelector(".cm-ghost")?.getAttribute("aria-hidden")).toBe("true");
    expect(view.state.doc.toString()).toBe("<Button");
  });

  it("is taken away by an edit, and by moving the cursor, because it was for where you were", () => {
    const view = make("<Button");
    view.dispatch({ effects: setGhost.of({ pos: 7, text: " x" }) });
    view.dispatch({ changes: { from: 0, insert: " " } });
    expect(ghost(view)).toBeNull();
    view.dispatch({ effects: setGhost.of({ pos: 8, text: " x" }) });
    view.dispatch({ selection: { anchor: 2 } });
    expect(ghost(view)).toBeNull();
  });

  it("is written into the text when it is accepted, and the cursor goes after it, in one undoable step", () => {
    const view = make("<Button");
    view.dispatch({ effects: setGhost.of({ pos: 7, text: ' variant="primary"' }) });
    expect(acceptGhost(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('<Button variant="primary"');
    expect(view.state.selection.main.head).toBe('<Button variant="primary"'.length);
    expect(ghost(view)).toBeNull();
  });

  it("does nothing to accept or dismiss when there is none, so Tab and Escape stay free for the editor", () => {
    const view = make("<Button");
    expect(acceptGhost(view)).toBe(false);
    expect(dismissGhost(view)).toBe(false);
  });

  it("is dropped by dismissing, and the text is untouched", () => {
    const view = make("<Button");
    view.dispatch({ effects: setGhost.of({ pos: 7, text: " x" }) });
    expect(dismissGhost(view)).toBe(true);
    expect(ghost(view)).toBeNull();
    expect(view.state.doc.toString()).toBe("<Button");
  });
});

describe("asking for a suggestion", () => {
  it("asks after you type, with the text and the cursor, and shows the answer", async () => {
    const suggest = vi.fn<Suggest>(async ({ doc, pos }) => (doc === "<Button" && pos === 7 ? " disabled" : null));
    const view = make("<Butto", suggest);
    type(view, "n");
    await settle();
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest.mock.calls[0][0]).toMatchObject({ doc: "<Button", pos: 7 });
    expect(ghost(view)).toEqual({ pos: 7, text: " disabled" });
  });

  it("does not ask when the text is changed from outside, only when a person types", async () => {
    const suggest = vi.fn<Suggest>(async () => "x");
    const view = make("<Button", suggest);
    view.dispatch({ changes: { from: 0, insert: "// " } });
    await settle();
    expect(suggest).not.toHaveBeenCalled();
  });

  it("drops an answer that arrives after the text has moved on", async () => {
    let answer: (text: string) => void = () => undefined;
    const suggest: Suggest = () => new Promise((resolve) => (answer = resolve));
    const view = make("<Butto", suggest);
    type(view, "n");
    await settle();
    type(view, " "); // typing again, before the answer
    answer("stale");
    await settle();
    expect(ghost(view)).toBeNull();
  });

  it("cancels the question when you type again, so a slow answer is not waited for", async () => {
    const signals: AbortSignal[] = [];
    const suggest: Suggest = ({ signal }) => (signals.push(signal), new Promise(() => undefined));
    const view = make("a", suggest);
    type(view, "b");
    await settle();
    type(view, "c");
    await settle();
    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
  });

  it("shows nothing when the answer is nothing, or when asking fails", async () => {
    for (const suggest of [async () => null, async () => "", () => Promise.reject(new Error("offline"))] as Suggest[]) {
      const view = make("a", suggest);
      type(view, "b");
      await settle();
      expect(ghost(view)).toBeNull();
    }
  });

  it("does not ask while text is selected", async () => {
    const suggest = vi.fn<Suggest>(async () => "x");
    const view = make("abc", suggest);
    view.dispatch({ changes: { from: 3, insert: "d" }, selection: { anchor: 0, head: 4 }, userEvent: "input.type" });
    await settle();
    expect(suggest).not.toHaveBeenCalled();
  });

  it("asks nothing when there is nobody to ask", async () => {
    const view = make("a", undefined);
    type(view, "b");
    await settle();
    expect(ghost(view)).toBeNull();
  });
});
