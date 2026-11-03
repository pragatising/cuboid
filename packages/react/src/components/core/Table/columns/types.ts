import type React from "react";
import type { TableCellAlign, TableSort } from "../types";

/** A column as the caller describes it: what it is called, how it is aligned, and what its menu has besides the standard items. */
export type TableColumn = {
  id: string;
  /** The header's content. When it is text it also names the column's menu button. */
  label: React.ReactNode;
  align?: TableCellAlign;
  /** Whether the column can be sorted, from its menu. @default true */
  sortable?: boolean;
  /** Items of this column's own (`ActionMenu.Item`s and `ActionMenu.Section`s), after the standard ones. */
  menu?: React.ReactNode;
};

/** How the table is sorted: by which column, which way. Null: not sorted. */
export type ColumnSort = { id: string; direction: "asc" | "desc" } | null;

/** Where a column can be moved to. */
export type ColumnMove = "left" | "right" | "start" | "end";

/** The words of the standard menu, for another language or another voice. */
export type TableColumnLabels = {
  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  layout: string;
  moveLeft: string;
  moveRight: string;
  moveToEnd: string;
  moveToStart: string;
  hide: string;
  /** The menu button's name, with the column's name before it when it is text. */
  options: string;
};

export type { TableSort };
