import { Extension, Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";

/** What the table plugin needs of every cell: how many columns and rows it spans, and (unused for now) a width. We never merge, so spans stay 1. */
const cellAttributes = () => ({
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
});

const spans = (dom: HTMLElement) => ({ colspan: Number(dom.getAttribute("colspan")) || 1, rowspan: Number(dom.getAttribute("rowspan")) || 1 });

/**
 * The table plugin finds tables by a `tableRole` on each node's schema spec (`table`, `row`, `cell`, `header_cell`). The engine builds specs from a fixed set of
 * keys, so this is how a node's `tableRole` gets into its spec. The `table` block (`blocks/table`) names its own through its definition's `spec`.
 */
export const TableRoles = Extension.create({
  name: "tableRoles",
  extendNodeSchema: (extension) => ({
    tableRole: callOrReturn(getExtensionField(extension, "tableRole", { name: extension.name, options: extension.options, storage: extension.storage })),
  }),
});

export const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  tableRole: "row",
  parseHTML: () => [{ tag: "tr" }],
  renderHTML: ({ HTMLAttributes }) => ["tr", mergeAttributes(HTMLAttributes, { "data-component": "Table.Row" }), 0],
});

/** A cell holds one line of inline content (text, marks, dates, pills, links) and nothing of its own to nest. Isolating, so Backspace and joins stop at its edge. */
export const TableCell = Node.create({
  name: "tableCell",
  content: "inline*",
  isolating: true,
  tableRole: "cell",
  addAttributes: cellAttributes,
  parseHTML: () => [{ tag: "td", getAttrs: (dom) => spans(dom as HTMLElement) }],
  renderHTML: ({ HTMLAttributes }) => ["td", mergeAttributes(HTMLAttributes, { "data-component": "Table.Cell", "data-row-layout": "wrap" }), 0],
});

/** A header cell: the same content, drawn as Cuboid's `Table.HeadCell`. A row or a column of them is the table's header. */
export const TableHeader = Node.create({
  name: "tableHeader",
  content: "inline*",
  isolating: true,
  tableRole: "header_cell",
  addAttributes: cellAttributes,
  parseHTML: () => [{ tag: "th", getAttrs: (dom) => spans(dom as HTMLElement) }],
  renderHTML: ({ HTMLAttributes }) => ["th", mergeAttributes(HTMLAttributes, { "data-component": "Table.HeadCell" }), 0],
});
