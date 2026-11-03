import { EditorState, Text } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { markEffects, markedField, setMarked, toMarks } from "./markedRanges";

const doc = Text.of(["function Example() {", "  return (", "    <Button>Save</Button>", "  );", "}"]);
const range = (a: [number, number], b: [number, number]) => ({ from: { line: a[0], column: a[1] }, to: { line: b[0], column: b[1] } });

/** What is decorated: the pieces, and the rows. */
const decorated = (state: EditorState) => {
  const found: { from: number; to: number; cls: string }[] = [];
  state.field(markedField).between(0, state.doc.length, (from, to, value) => void found.push({ from, to, cls: (value.spec as { class: string }).class }));
  return found;
};
const make = () => EditorState.create({ doc, extensions: [markedField] });

describe("toMarks", () => {
  it("turns lines and columns into offsets", () => {
    expect(toMarks(doc, [range([3, 4], [3, 25])])).toEqual([{ from: doc.line(3).from + 4, to: doc.line(3).from + 25 }]);
  });

  it("follows a range over several lines", () => {
    const [mark] = toMarks(doc, [range([2, 2], [4, 3])]);
    expect(doc.sliceString(mark.from, mark.to)).toBe("return (\n    <Button>Save</Button>\n  )");
  });

  it("keeps a column inside its line", () => {
    const [mark] = toMarks(doc, [range([1, 0], [1, 999])]);
    expect(mark.to).toBe(doc.line(1).to);
  });

  it("says where a line of the file is in the document, and leaves out a range that is not shown", () => {
    // The document shows the file's lines 10 to 14.
    const lineOf = (file: number) => (file >= 10 && file <= 14 ? file - 9 : null);
    expect(toMarks(doc, [range([12, 4], [12, 25])], lineOf)).toEqual(toMarks(doc, [range([3, 4], [3, 25])]));
    expect(toMarks(doc, [range([2, 0], [2, 5])], lineOf)).toEqual([]);
    expect(toMarks(doc, [range([10, 0], [30, 5])], lineOf)).toEqual([]);
  });
});

describe("marking from outside", () => {
  it("marks the piece and the rows it is on", () => {
    const state = make().update({ effects: setMarked.of(toMarks(doc, [range([3, 4], [3, 25])])) }).state;
    const found = decorated(state);
    expect(found.filter((d) => d.cls === "cm-marked").map((d) => doc.sliceString(d.from, d.to))).toEqual(["<Button>Save</Button>"]);
    expect(found.filter((d) => d.cls === "cm-marked-line")).toHaveLength(1);
  });

  it("marks every row of a range over several lines", () => {
    const state = make().update({ effects: setMarked.of(toMarks(doc, [range([2, 2], [4, 3])])) }).state;
    expect(decorated(state).filter((d) => d.cls === "cm-marked-line")).toHaveLength(3);
  });

  it("replaces what was marked, and an empty set clears it", () => {
    let state = make().update({ effects: setMarked.of([{ from: 0, to: 8 }]) }).state;
    state = state.update({ effects: setMarked.of([{ from: 9, to: 16 }]) }).state;
    expect(decorated(state).filter((d) => d.cls === "cm-marked").map((d) => d.from)).toEqual([9]);
    expect(decorated(state.update({ effects: setMarked.of([]) }).state)).toEqual([]);
  });

  it("follows the text as it is edited", () => {
    let state = make().update({ effects: setMarked.of([{ from: 9, to: 16 }]) }).state;
    state = state.update({ changes: { from: 0, insert: "// note\n" } }).state;
    const [mark] = decorated(state).filter((d) => d.cls === "cm-marked");
    expect(state.doc.sliceString(mark.from, mark.to)).toBe("Example");
  });

  it("brings the first piece into view when it is set", () => {
    const effects = markEffects(doc, [range([3, 4], [3, 25]), range([1, 0], [1, 8])]);
    expect(effects).toHaveLength(2);
    expect(markEffects(doc, [])).toHaveLength(1);
  });
});
