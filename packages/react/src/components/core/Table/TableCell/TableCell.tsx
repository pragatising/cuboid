import React from "react";
import { VisuallyHidden } from "../../VisuallyHidden";
import { useTableContext } from "../TableContext";
import { TableCellContent } from "./TableCellContent";
import type { TableCellAlign, TableRowLayout } from "../types";

export type TableCellProps = React.ComponentPropsWithRef<"td"> & {
  align?: TableCellAlign;
  /** How content that does not fit is handled here, over what the table says. Defaults to the table's `rowLayout`. */
  rowLayout?: TableRowLayout;
  /** The value is on its way: a skeleton bar stands in for the content, and the cell is marked busy. @default false */
  loading?: boolean;
  /** The whole text, shown in a popover when a truncated cell cuts it off. Needed only when the content is not a string. */
  fullText?: string;
};

/**
 * A body cell. Its content sits in a box so it can be cut off, loading or revealed without touching the `td` (which a table
 * lays out). When a truncating cell does cut its text, the whole text is in a popover (on hover, click or focus) and the cell
 * content is reachable with the keyboard.
 */
export function TableCell({ align, rowLayout: own, loading = false, fullText, children, ...props }: TableCellProps) {
  const { rowLayout: inherited } = useTableContext();
  const rowLayout = own ?? inherited;
  return (
    <td data-component="Table.Cell" data-align={align} data-row-layout={rowLayout} data-loading={loading ? "" : undefined} aria-busy={loading || undefined} {...props}>
      {loading ? (
        <span data-component="Table.Cell.Content">
          <span data-component="Table.Cell.Skeleton" aria-hidden="true" />
          <VisuallyHidden>Loading</VisuallyHidden>
        </span>
      ) : (
        <TableCellContent fullText={fullText} reveal={rowLayout === "truncate"}>
          {children}
        </TableCellContent>
      )}
    </td>
  );
}
