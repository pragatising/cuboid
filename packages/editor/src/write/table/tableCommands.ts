import type { Editor } from "@tiptap/core";
import type { Command } from "@tiptap/pm/state";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  isInTable,
  selectedRect,
  toggleHeaderColumn,
  toggleHeaderRow,
} from "@tiptap/pm/tables";
import { MAX_TABLE_COLUMNS } from "../../constants";

export type Side = "before" | "after";

const run = (editor: Editor, command: Command) => command(editor.state, editor.view.dispatch, editor.view);

/** Whether the cursor (or the selected cells) is in a table. */
export const inTable = (editor: Editor) => isInTable(editor.state);

/** A row next to the one the cursor is in. */
export const addRow = (editor: Editor, side: Side) => run(editor, side === "before" ? addRowBefore : addRowAfter);

/** A column next to the one the cursor is in, unless the table already has `MAX_TABLE_COLUMNS`. */
export function addColumn(editor: Editor, side: Side) {
  if (!inTable(editor) || selectedRect(editor.state).map.width >= MAX_TABLE_COLUMNS) return false;
  return run(editor, side === "before" ? addColumnBefore : addColumnAfter);
}

/** Removes the selected rows (or the cursor's); the last row takes the whole table with it. */
export const removeRow = (editor: Editor) => run(editor, deleteRow);

/** Removes the selected columns (or the cursor's); the last column takes the whole table with it. */
export const removeColumn = (editor: Editor) => run(editor, deleteColumn);

export const removeTable = (editor: Editor) => run(editor, deleteTable);

/** Turns the table's first row into header cells, or back into plain ones. */
export const toggleHeaderRowOf = (editor: Editor) => run(editor, toggleHeaderRow);

/** Turns the table's first column into header cells, or back into plain ones. */
export const toggleHeaderColumnOf = (editor: Editor) => run(editor, toggleHeaderColumn);
