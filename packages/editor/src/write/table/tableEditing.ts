import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { goToNextCell, isInTable, selectedRect, tableEditing } from "@tiptap/pm/tables";
import { exitForward } from "../exits";
import { addRow } from "./tableCommands";
import "./tableSelection.module.css";

/** Moves the cursor into the cell below the one it is in. False in the last row. */
function moveDown(editor: Editor): boolean {
  const { state, view } = editor;
  const rect = selectedRect(state);
  if (rect.bottom >= rect.map.height) return false;
  const cellPos = rect.tableStart + rect.map.map[rect.bottom * rect.map.width + rect.left];
  view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(cellPos + 1))).scrollIntoView());
  return true;
}

/** The depth of the table the cursor is in. */
function tableDepth(editor: Editor): number {
  const { $from } = editor.state.selection;
  let depth = $from.depth;
  while (depth > 0 && $from.node(depth).type.spec.tableRole !== "table") depth--;
  return depth;
}

/**
 * How a table is edited. The table plugin gives selecting cells (drag, Shift-click, arrows), clearing and pasting a range, and keeps the table well formed.
 * The keys are the writer's: Tab goes to the next cell, and from the last one adds a row; Shift-Tab goes back; Enter goes down a cell, and from the last
 * row leaves the table (a cell is one line, so Shift-Enter is the line break). A key that has nothing to do in a table is taken all the same, so Tab never
 * moves focus out of the page.
 */
export const TableEditing = Extension.create({
  name: "tableEditing",
  addProseMirrorPlugins: () => [tableEditing()],
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (!isInTable(editor.state)) return false;
        if (!goToNextCell(1)(editor.state, editor.view.dispatch)) {
          addRow(editor, "after");
          goToNextCell(1)(editor.state, editor.view.dispatch);
        }
        return true;
      },
      "Shift-Tab": ({ editor }) => {
        if (!isInTable(editor.state)) return false;
        goToNextCell(-1)(editor.state, editor.view.dispatch);
        return true;
      },
      Enter: ({ editor }) => {
        if (!isInTable(editor.state)) return false;
        return moveDown(editor) || exitForward(editor, tableDepth(editor));
      },
    };
  },
});
