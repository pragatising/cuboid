import React from "react";
import { ariaSort } from "./sort";
import { TableHeadCellAction, TableHeadCellSortMark } from "./TableHeadCellAction";
import type { TableCellAlign, TableSort } from "../types";

export type TableHeadCellProps = React.ComponentPropsWithRef<"th"> & {
  align?: TableCellAlign;
  /**
   * The column's order, for a column that can be sorted: `none` until it is, then `asc` or `desc`. Sets `aria-sort` and, once
   * sorted, shows the direction. Leave unset for a column that cannot be sorted.
   */
  sort?: TableSort;
  /**
   * The column's menu: `ActionMenu` items and sections (sorting, filtering, hiding, inserting a column, whatever the table
   * offers). With it, the header ends in a button that opens it; the kebab shows while the header is hovered or focused, the
   * sort arrow always once the column is sorted.
   */
  menu?: React.ReactNode;
  /** The menu button's accessible name. @default "Column options" */
  menuLabel?: string;
};

/**
 * A column header: its label, and at the end the column's menu button or sort mark. It is a plain `th` otherwise, so
 * anything can be its content (a checkbox for select-all, an icon and a label).
 */
export function TableHeadCell({ align, sort, menu, menuLabel = "Column options", children, ...props }: TableHeadCellProps) {
  const hasMenu = menu !== undefined && menu !== null && menu !== false;
  return (
    <th data-component="Table.HeadCell" data-align={align} scope="col" aria-sort={ariaSort(sort)} {...props}>
      <div data-component="Table.HeadCell.Content">
        <span data-component="Table.HeadCell.Label">{children}</span>
        {hasMenu ? (
          <TableHeadCellAction sort={sort ?? "none"} menu={menu} label={menuLabel} />
        ) : sort === "asc" || sort === "desc" ? (
          <TableHeadCellSortMark sort={sort} />
        ) : null}
      </div>
    </th>
  );
}
