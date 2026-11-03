import { Prec, StateEffect, StateField } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, keymap } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";

/** What a suggester is given, and what it may answer: text to insert at the cursor, or nothing. */
export type SuggestContext = { doc: string; pos: number; signal: AbortSignal };
export type Suggest = (context: SuggestContext) => Promise<string | null | undefined>;

export type Ghost = { pos: number; text: string };

/** Puts a suggestion ahead of the cursor, or takes it away. */
export const setGhost = StateEffect.define<Ghost | null>();

class GhostWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: GhostWidget) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-ghost";
    span.textContent = this.text;
    span.setAttribute("aria-hidden", "true");
    return span;
  }
}

/** The suggestion being shown. Any edit, and any move of the cursor, takes it away: it was for where you were. */
export const ghostField = StateField.define<Ghost | null>({
  create: () => null,
  update(ghost, tr) {
    for (const effect of tr.effects) if (effect.is(setGhost)) return effect.value;
    return tr.docChanged || tr.selection ? null : ghost;
  },
  provide: (field) => EditorView.decorations.from(field, (ghost) => (ghost ? Decoration.set([Decoration.widget({ widget: new GhostWidget(ghost.text), side: 1 }).range(ghost.pos)]) : Decoration.none)),
});

export function acceptGhost(view: EditorView): boolean {
  const ghost = view.state.field(ghostField);
  if (!ghost) return false;
  view.dispatch({ changes: { from: ghost.pos, insert: ghost.text }, selection: { anchor: ghost.pos + ghost.text.length }, effects: setGhost.of(null), userEvent: "input.complete" });
  return true;
}

export function dismissGhost(view: EditorView): boolean {
  if (!view.state.field(ghostField)) return false;
  view.dispatch({ effects: setGhost.of(null) });
  return true;
}

/**
 * The seam for suggestions from outside: after you type and pause, the suggester is asked what comes next, and its answer is shown as
 * ghost text that Tab accepts and Escape drops. Typing again cancels the question. What answers is not the editor's business (a model of
 * the components, a language model), so it is given as a function, asked afresh each time.
 */
export function ghostText(options: { suggest: () => Suggest | undefined; delay?: number }): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      timer = 0;
      controller: AbortController | null = null;
      update(u: ViewUpdate) {
        if (!u.docChanged) return;
        this.cancel();
        if (!u.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))) return;
        const view = u.view;
        this.timer = window.setTimeout(() => this.ask(view), options.delay ?? 250);
      }
      cancel() {
        window.clearTimeout(this.timer);
        this.controller?.abort();
        this.controller = null;
      }
      async ask(view: EditorView) {
        const suggest = options.suggest();
        const selection = view.state.selection.main;
        if (!suggest || !selection.empty) return;
        const asked = view.state.doc;
        this.controller = new AbortController();
        const { signal } = this.controller;
        const text = await suggest({ doc: asked.toString(), pos: selection.head, signal }).catch(() => null);
        // The answer is for the document as it was asked: if it has moved on, it is stale.
        if (signal.aborted || !text || !view.state.doc.eq(asked)) return;
        view.dispatch({ effects: setGhost.of({ pos: selection.head, text }) });
      }
      destroy() {
        this.cancel();
      }
    },
  );
  return [ghostField, plugin, Prec.highest(keymap.of([{ key: "Tab", run: acceptGhost }, { key: "Escape", run: dismissGhost }]))];
}
