import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { COLUMN_CONTENT } from "../../constants";
import { MAX_COLUMNS, MIN_COLUMNS } from "./constants";
import { ColumnsView } from "./ColumnsView";

export const Column = Node.create({
  name: "column",
  content: COLUMN_CONTENT,
  isolating: true,
  /** The column's share of the row, relative to its siblings. */
  addAttributes: () => ({ flex: { default: 1 } }),
  parseHTML: () => [{ tag: "div[data-column]" }],
  renderHTML: ({ node, HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-column": "", "data-prose-flow": "", style: `flex:${node.attrs.flex} 1 0` }), 0],
  // Its own view so a width previewed while a divider is dragged is not read as an edit, and not redrawn back by the editor.
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.dataset.column = "";
      dom.dataset.proseFlow = "";
      dom.style.flex = `${node.attrs.flex} 1 0`;
      return {
        dom,
        contentDOM: dom,
        update: (next) => (next.type.name !== "column" ? false : ((dom.style.flex = `${next.attrs.flex} 1 0`), true)),
        ignoreMutation: (mutation) => mutation.type === "attributes",
      };
    };
  },
});

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: `column{${MIN_COLUMNS},${MAX_COLUMNS}}`,
  isolating: true,
  defining: true,
  parseHTML: () => [{ tag: "div[data-columns]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-columns": "" }), 0],
  addNodeView() {
    return ReactNodeViewRenderer(ColumnsView);
  },
});
