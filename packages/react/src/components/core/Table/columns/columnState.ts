import type { ColumnMove, ColumnSort } from "./types";

/** The ids in the order they are shown, without the hidden ones. */
export const visibleIds = (order: readonly string[], hidden: readonly string[]) => order.filter((id) => !hidden.includes(id));

/**
 * The order after a column moves. `left` and `right` go past the next column that is *shown* (a hidden one has no place to step over), `start` and
 * `end` go to the ends. A column that cannot move that way, or is not in the order, leaves it as it was.
 */
export function moveColumn(order: readonly string[], hidden: readonly string[], id: string, to: ColumnMove): string[] {
  const at = order.indexOf(id);
  if (at < 0) return [...order];
  const rest = order.filter((other) => other !== id);
  const shown = visibleIds(order, hidden);
  const place = shown.indexOf(id);
  if (to === "start") return [id, ...rest];
  if (to === "end") return [...rest, id];
  // The shown column it steps past; with none that way it stays.
  const over = to === "left" ? shown[place - 1] : shown[place + 1];
  if (over === undefined || place < 0) return [...order];
  const into = rest.indexOf(over);
  return to === "left" ? [...rest.slice(0, into), id, ...rest.slice(into)] : [...rest.slice(0, into + 1), id, ...rest.slice(into + 1)];
}

/** What compares as less, equal or greater, for a column of any one kind of value: numbers by size, dates by time, text as a person sorts it. */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

const isEmpty = (value: unknown) => value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));

/**
 * The rows in the order of a sort, as a new list: a stable sort, with the rows that have no value last whichever way it goes (an empty cell is
 * not the smallest or the largest, it is the missing). `valueOf` reads a row's value for a column. Without a sort, the rows as they are.
 */
export function sortRows<Row>(rows: readonly Row[], sort: ColumnSort, valueOf: (row: Row, id: string) => unknown): Row[] {
  if (!sort) return [...rows];
  const sign = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: valueOf(row, sort.id) }))
    .sort((a, b) => {
      if (isEmpty(a.value) || isEmpty(b.value)) return isEmpty(a.value) === isEmpty(b.value) ? a.index - b.index : isEmpty(a.value) ? 1 : -1;
      return sign * compareValues(a.value, b.value) || a.index - b.index;
    })
    .map(({ row }) => row);
}
