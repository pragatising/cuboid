import { describe, expect, it } from "vitest";
import { compareValues, moveColumn, sortRows, visibleIds } from "./columnState";

const order = ["a", "b", "c", "d"];

describe("visibleIds", () => {
  it("is the order without the hidden", () => {
    expect(visibleIds(order, ["b", "d"])).toEqual(["a", "c"]);
    expect(visibleIds(order, [])).toEqual(order);
  });
});

describe("moveColumn", () => {
  it("moves one place left or right", () => {
    expect(moveColumn(order, [], "c", "left")).toEqual(["a", "c", "b", "d"]);
    expect(moveColumn(order, [], "b", "right")).toEqual(["a", "c", "b", "d"]);
  });

  it("moves to either end", () => {
    expect(moveColumn(order, [], "c", "start")).toEqual(["c", "a", "b", "d"]);
    expect(moveColumn(order, [], "b", "end")).toEqual(["a", "c", "d", "b"]);
  });

  it("stays where it is when it cannot move that way", () => {
    expect(moveColumn(order, [], "a", "left")).toEqual(order);
    expect(moveColumn(order, [], "d", "right")).toEqual(order);
  });

  it("goes past the next column that is shown, not past a hidden one", () => {
    // `b` is hidden: moving `c` left puts it before `a`, the column it can be seen to step past.
    expect(moveColumn(order, ["b"], "c", "left")).toEqual(["c", "a", "b", "d"]);
    expect(moveColumn(order, ["c"], "b", "right")).toEqual(["a", "c", "d", "b"]);
  });

  it("does not change an order it does not know the column of, and never changes its input", () => {
    expect(moveColumn(order, [], "z", "left")).toEqual(order);
    const input = [...order];
    moveColumn(input, [], "c", "start");
    expect(input).toEqual(order);
  });

  it("keeps every column exactly once", () => {
    for (const to of ["left", "right", "start", "end"] as const) expect([...moveColumn(order, ["b"], "c", to)].sort()).toEqual(order);
  });
});

describe("compareValues", () => {
  it("compares numbers by size, not as text", () => {
    expect(compareValues(10, 9)).toBeGreaterThan(0);
  });

  it("compares text as a person sorts it: case-blind, and numbers inside by size", () => {
    expect(compareValues("apple", "Banana")).toBeLessThan(0);
    expect(compareValues("item 10", "item 9")).toBeGreaterThan(0);
  });

  it("compares dates by time and booleans false before true", () => {
    expect(compareValues(new Date(2020, 1, 1), new Date(2021, 1, 1))).toBeLessThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
  });
});

describe("sortRows", () => {
  const rows = [
    { n: "c", v: 30 },
    { n: "a", v: 10 },
    { n: "b", v: 20 },
    { n: "x", v: null },
    { n: "y", v: undefined },
  ];
  const value = (row: { n: string; v: unknown }, id: string) => (id === "v" ? row.v : row.n);

  it("is the rows as they are with no sort, and never changes its input", () => {
    expect(sortRows(rows, null, value)).toEqual(rows);
    const before = [...rows];
    sortRows(rows, { id: "v", direction: "asc" }, value);
    expect(rows).toEqual(before);
  });

  it("sorts ascending and descending", () => {
    expect(sortRows(rows, { id: "n", direction: "asc" }, value).map((r) => r.n)).toEqual(["a", "b", "c", "x", "y"]);
    expect(sortRows(rows, { id: "n", direction: "desc" }, value).map((r) => r.n)).toEqual(["y", "x", "c", "b", "a"]);
  });

  it("puts rows with no value last, whichever way it goes, in the order they were in", () => {
    expect(sortRows(rows, { id: "v", direction: "asc" }, value).map((r) => r.n)).toEqual(["a", "b", "c", "x", "y"]);
    expect(sortRows(rows, { id: "v", direction: "desc" }, value).map((r) => r.n)).toEqual(["c", "b", "a", "x", "y"]);
  });

  it("is stable: rows that compare equal keep their order", () => {
    const same = [{ n: "1", v: 1 }, { n: "2", v: 1 }, { n: "3", v: 1 }];
    expect(sortRows(same, { id: "v", direction: "desc" }, value).map((r) => r.n)).toEqual(["1", "2", "3"]);
  });
});
