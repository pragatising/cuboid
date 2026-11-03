import React, { useMemo } from "react";
import { TableBody } from "./TableBody";
import { TableCell } from "./TableCell";
import { TableContext } from "./TableContext";
import { TableHeadCell } from "./TableHeadCell";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import type { TableDensity, TableLayout, TableLines, TableRowLayout } from "./types";
// The rules are keyed on the parts' `data-component`, not on a class, so an editor's own DOM is drawn by them too.
import "./Table.module.css";

export type TableProps = React.ComponentPropsWithRef<"table"> & {
  /** Cell padding and row height: `dense` (32px) or `spacious` (40px), from the `table.sizes.density` tokens. @default "dense" */
  density?: TableDensity;
  /**
   * Internal dividers between cells.
   * - `grid`: horizontal and vertical
   * - `rows`: horizontal row lines only
   * - `none`: no internal lines; the outer frame stays
   * @default "grid"
   */
  lines?: TableLines;
  /**
   * What every cell does with content that does not fit, unless a cell says otherwise: `wrap` onto more lines, or `truncate` to one line, cut
   * off with an ellipsis, with the whole text a hover, click or focus away. Truncating needs the columns to share a width, so it implies
   * `layout="fixed"` and wants a container that has one.
   * @default "truncate"
   */
  rowLayout?: TableRowLayout;
  /**
   * How the columns are sized. `auto` fits the content, anywhere. `fixed` shares the container's width equally (or by `col` widths); in a
   * container that shrinks to its content it has nothing to share. `scroll` gives every column the width its `col` says and fills a container
   * wider than them all, or scrolls sideways in a narrower one. Follows `rowLayout` unless given.
   */
  layout?: TableLayout;
  /** Merged onto the frame around the table; `className` and `style` go to the table itself. */
  wrapperClassName?: string;
  /** Other attributes for the frame (`data-*`, `id`…): they go there, not to the table. */
  wrapperProps?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
};

function TableRoot({ density = "dense", lines = "grid", rowLayout = "truncate", layout = rowLayout === "truncate" ? "fixed" : "auto", wrapperClassName, wrapperProps, ...props }: TableProps) {
  const context = useMemo(() => ({ rowLayout }), [rowLayout]);
  return (
    <TableContext.Provider value={context}>
      <div
        data-component="Table.Root"
        data-density={density}
        data-lines={lines}
        data-layout={layout}
        {...wrapperProps}
        className={[wrapperClassName, wrapperProps?.className].filter(Boolean).join(" ") || undefined}
      >
        <table data-component="Table" {...props} />
      </div>
    </TableContext.Provider>
  );
}

/**
 * A table: a frame (the border, the rounded corners, the sideways scroll) around a real `table`, and its parts `Header`, `Body`, `Row`,
 * `HeadCell` and `Cell`. The choices that apply to the whole table (`density`, `lines`, `rowLayout`, `layout`) are its props and reach
 * the parts as attributes and context; the colours, sizes and states are `--cube-table-*` tokens read in CSS. As attributes on the frame
 * and the table, the same rules draw a table an editor builds as plain DOM.
 */
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  HeadCell: TableHeadCell,
  Cell: TableCell,
});
