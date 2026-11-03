import { StateEffect, StateField } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";

/** A piece of the document, as offsets. */
export type Mark = { from: number; to: number };

/** A position as the shell's source ranges give it: a 1-based line, and a column into that line. */
export type LineColumn = { line: number; column: number };
export type SourceRange = { from: LineColumn; to: LineColumn };

/**
 * Pieces of the document a part of the page was written as, from outside the editor: what the pointer is over elsewhere. Setting them
 * marks them and brings the first into view; they follow the text as it is edited, until they are set again.
 */
export const setMarked = StateEffect.define<Mark[]>();

const piece = Decoration.mark({ class: "cm-marked" });
const row = Decoration.line({ class: "cm-marked-line" });

export const markedField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (!effect.is(setMarked)) continue;
      const found: { from: number; to: number; value: Decoration }[] = [];
      for (const { from, to } of effect.value) {
        if (to > from) found.push({ from, to, value: piece });
        for (let at = tr.state.doc.lineAt(from); ; at = tr.state.doc.line(at.number + 1)) {
          found.push({ from: at.from, to: at.from, value: row });
          if (at.to >= to || at.number >= tr.state.doc.lines) break;
        }
      }
      return Decoration.set(found, true);
    }
    return decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * Source ranges (lines and columns of the file they were recorded in) as offsets in this document. `lineOf` says which line of the
 * document a line of the file is, for a document that shows only part of the file; a range that is not in view is left out.
 */
export function toMarks(doc: Text, ranges: SourceRange[], lineOf: (fileLine: number) => number | null = (line) => line): Mark[] {
  const at = ({ line, column }: LineColumn) => {
    const shown = lineOf(line);
    if (shown === null || shown < 1 || shown > doc.lines) return null;
    const l = doc.line(shown);
    return l.from + Math.min(column, l.length);
  };
  return ranges.flatMap((range) => {
    const from = at(range.from);
    const to = at(range.to);
    return from === null || to === null ? [] : [{ from, to }];
  });
}

/** The effect that marks `ranges` and shows the first of them. */
export const markEffects = (doc: Text, ranges: SourceRange[], lineOf?: (fileLine: number) => number | null) => {
  const marks = toMarks(doc, ranges, lineOf);
  return [setMarked.of(marks), ...(marks[0] ? [EditorView.scrollIntoView(marks[0].from, { y: "nearest" })] : [])];
};
