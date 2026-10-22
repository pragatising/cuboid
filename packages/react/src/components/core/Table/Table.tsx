import React, { useState } from "react";
import { clsx } from "clsx";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type SortingState,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import classes from "./Table.module.css";

export type TableRowLayout = "wrap" | "truncate" | "fixed";
export type TableCellAlign = "left" | "center" | "right";
export type TableDensity = "dense" | "spacious";
/** Internal cell dividers — outer frame stays on {@link TableRoot}. */
export type TableLines = "none" | "rows" | "grid";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    rowLayout?: TableRowLayout;
    align?: TableCellAlign;
    /** CSS width for `<col>` — e.g. `28%`, `10rem`, `120px`, `max-content`. Omit for flexible remainder. */
    width?: string;
  }
}

export type TableRootProps = React.ComponentPropsWithRef<"div"> & {
  /** Cell padding + row height: `spacious` (40px) or `dense` (32px), from the `table.sizes.density` tokens. @default "spacious" */
  density?: TableDensity;
  /**
   * Internal dividers between cells.
   * - `grid`: horizontal + vertical
   * - `rows`: horizontal row lines only
   * - `none`: no internal lines; the outer frame from TableRoot remains
   * @default "grid"
   */
  lines?: TableLines;
};

/**
 * Scroll + border shell around a {@link Table}. It resolves the `table` tokens for the chosen density once and hands
 * them to the parts below as element-scoped variables (--table-row-height, --table-header-bg, …).
 */
export function TableRoot({ density = "spacious", lines = "grid", className, ...props }: TableRootProps) {
  const { table, text, fontWeight, borderWidth, focusRing, space } = useTokens();
  const d = table.sizes.density[density];

  return (
    <div
      {...mergeProps(
        {
          "data-component": "Table.Root",
          "data-lines": lines,
          className: clsx(classes.TableRoot, className),
          style: cssVars("table", {
            borderWidth: borderWidth.thin,
            borderRadius: table.sizes.borderRadius,
            containerBorder: table.color.container.borderColor,
            headerBg: table.color.header.bgColor,
            headerFg: table.color.header.fgColor,
            headerBorder: table.color.header.borderColor,
            bodyBg: table.color.body.bgColor,
            bodyFg: table.color.body.fgColor,
            bodyBorder: table.color.body.borderColor,
            headerFont: text.size.md,
            headerWeight: String(fontWeight.medium),
            bodyFont: text.size.md,
            cellPaddingInline: d.cellPaddingInline,
            cellPaddingBlock: d.cellPaddingBlock,
            rowHeight: d.rowHeight,
            sortGap: space.xxs,
            focusColor: focusRing.color,
            focusWidth: focusRing.width,
            focusOffset: focusRing.offset,
          }),
        },
        props,
      )}
    />
  );
}

export type TableProps = React.ComponentPropsWithRef<"table">;

export function TableElement({ className, ...props }: TableProps) {
  return <table {...mergeProps({ "data-component": "Table", className: clsx(classes.Table, className) }, props)} />;
}

export type TableHeaderProps = React.ComponentPropsWithRef<"thead">;

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead {...mergeProps({ "data-component": "Table.Header", className: clsx(classes.TableHeader, className) }, props)} />;
}

export type TableBodyProps = React.ComponentPropsWithRef<"tbody">;

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody {...mergeProps({ "data-component": "Table.Body", className: clsx(classes.TableBody, className) }, props)} />;
}

export type TableRowProps = React.ComponentPropsWithRef<"tr">;

export function TableRow({ className, ...props }: TableRowProps) {
  return <tr {...mergeProps({ "data-component": "Table.Row", className: clsx(classes.TableRow, className) }, props)} />;
}

export type TableHeadCellProps = React.ComponentPropsWithRef<"th"> & {
  align?: TableCellAlign;
};

export function TableHeadCell({ align, className, ...props }: TableHeadCellProps) {
  return (
    <th
      {...mergeProps(
        { "data-component": "Table.HeadCell", "data-align": align, scope: "col", className: clsx(classes.TableHeadCell, className) },
        props,
      )}
    />
  );
}

export type TableCellProps = React.ComponentPropsWithRef<"td"> & {
  align?: TableCellAlign;
  /** How content that does not fit is handled. @default "wrap" */
  rowLayout?: TableRowLayout;
};

export function TableCell({ align, rowLayout = "wrap", className, children, ...props }: TableCellProps) {
  return (
    <td
      {...mergeProps(
        {
          "data-component": "Table.Cell",
          "data-align": align,
          "data-row-layout": rowLayout,
          className: clsx(classes.TableCell, className),
        },
        props,
      )}
    >
      <span className={classes.TableCellInner}>{children}</span>
    </td>
  );
}

/** Composable table parts: use with {@link TableRoot} for manual markup or {@link SimpleTable} for TanStack. */
export const Table = Object.assign(TableElement, {
  Root: TableRoot,
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  HeadCell: TableHeadCell,
  Cell: TableCell,
});

export interface SimpleTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Default cell layout when a column has no `meta.rowLayout`. */
  rowLayout?: TableRowLayout;
  /** Cell padding + row height. Default: spacious (40px rows). */
  density?: TableDensity;
  /** Internal cell dividers. Default: grid. */
  lines?: TableLines;
  className?: string;
  tableClassName?: string;
  getRowId?: (originalRow: TData, index: number) => string;
  /** Enable clickable sortable headers. Default: false. */
  enableSorting?: boolean;
  /** Controlled sorting state. When omitted, SimpleTable manages sorting internally. */
  sorting?: SortingState;
  /** Called when a sortable header changes the sorting state. */
  onSortingChange?: OnChangeFn<SortingState>;
}

/**
 * TanStack-powered table with Cuboid styling. Pass column defs and row data;
 * enable sorting with `enableSorting`; selection and other behaviors can be added
 * through the composable table parts.
 */
export function SimpleTable<TData>({
  columns,
  data,
  rowLayout = "truncate",
  density = "spacious",
  lines = "grid",
  className,
  tableClassName,
  getRowId,
  enableSorting = false,
  sorting,
  onSortingChange,
}: SimpleTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const activeSorting = sorting ?? internalSorting;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    enableSorting,
    state: { sorting: activeSorting },
    onSortingChange: (updater) => {
      if (sorting === undefined) setInternalSorting(updater instanceof Function ? updater(activeSorting) : updater);
      onSortingChange?.(updater);
    },
  });

  return (
    <TableRoot density={density} lines={lines} className={className}>
      <Table className={tableClassName}>
        <colgroup>
          {table.getAllLeafColumns().map((column) => {
            const width = column.columnDef.meta?.width;
            return <col key={column.id} style={width ? { width } : undefined} />;
          })}
        </colgroup>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeadCell
                  key={header.id}
                  align={header.column.columnDef.meta?.align}
                  aria-sort={
                    header.column.getIsSorted() === "asc"
                      ? "ascending"
                      : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : enableSorting && header.column.getCanSort()
                          ? "none"
                          : undefined
                  }
                >
                  {header.isPlaceholder ? null : enableSorting && header.column.getCanSort() ? (
                    <button
                      type="button"
                      className={classes.TableSortButton}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={`Sort by ${header.column.id}`}
                    >
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <Icon
                        size="xs"
                        name={
                          header.column.getIsSorted() === "asc"
                            ? "arrow_upward"
                            : header.column.getIsSorted() === "desc"
                              ? "arrow_downward"
                              : "sort"
                        }
                      />
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHeadCell>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  align={cell.column.columnDef.meta?.align}
                  rowLayout={cell.column.columnDef.meta?.rowLayout ?? rowLayout}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableRoot>
  );
}

export type { ColumnDef, Row, TanStackTable };
