import type { DocNode } from "../../core";
import { defineBlock } from "../../core";
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from "./constants";
import { tableRead } from "./table.read";

const cells = (type: "tableHeader" | "tableCell"): DocNode[] => Array.from({ length: DEFAULT_COLUMNS }, () => ({ type }));

/** What the menus put in the page: a header row and empty rows under it. */
const NEW_TABLE: DocNode = {
  type: "table",
  content: [
    { type: "tableRow", content: cells("tableHeader") },
    ...Array.from({ length: DEFAULT_ROWS - 1 }, () => ({ type: "tableRow", content: cells("tableCell") })),
  ],
};

/**
 * A table in a document: rows of cells, each cell one line of inline content (text with marks, dates, pills, links; no blocks). The block is the
 * `table` and its rows, drawn as the plain elements Cuboid's `Table` rules are written for (`div > table > tbody > tr`), so the editor's table and
 * the reader's are the same markup. Which cells are headers is the type of the cell (`tableHeader`), as in HTML. The nodes inside (rows, cells) and
 * their editing are in `write/table`.
 */
export const table = defineBlock(tableRead, {
  holds: "blocks",
  accepts: "tableRow+",
  element: {
    tag: "tbody",
    attributes: { "data-component": "Table.Body" },
    around: [
      { tag: "div", attributes: { "data-component": "Table.Root", "data-density": "spacious", "data-lines": "grid", "data-layout": "fixed" } },
      { tag: "table", attributes: { "data-component": "Table" } },
    ],
  },
  spec: { tableRole: "table", isolating: true },
  insert: NEW_TABLE,
  menu: { label: "Table", group: "basic", keywords: ["grid", "rows", "cells", "spreadsheet"] },
});
