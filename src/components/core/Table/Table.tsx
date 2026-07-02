import React, { forwardRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import styles from "./Table.module.css";

export type TableRowLayout = "wrap" | "truncate" | "fixed";
export type TableCellAlign = "left" | "center" | "right";
export type TableDensity = "dense" | "spacious";
/** Internal cell dividers — outer frame stays on {@link TableRoot}. */
export type TableLines = "none" | "rows" | "grid";

function densityClass(density: TableDensity): string {
  return density === "dense"
    ? styles["TableRoot--density-dense"]
    : styles["TableRoot--density-spacious"];
}

function linesClass(lines: TableLines): string {
  switch (lines) {
    case "none":
      return styles["TableRoot--lines-none"];
    case "rows":
      return styles["TableRoot--lines-rows"];
    case "grid":
      return styles["TableRoot--lines-grid"];
  }
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    rowLayout?: TableRowLayout;
    align?: TableCellAlign;
    /** CSS width for `<col>` — e.g. `28%`, `10rem`, `120px`, `max-content`. Omit for flexible remainder. */
    width?: string;
  }
}

function alignClass(prefix: "TableHeadCell" | "TableCell", align?: TableCellAlign): string | undefined {
  if (align === "center") return styles[`${prefix}--align-center`];
  if (align === "right") return styles[`${prefix}--align-right`];
  return undefined;
}

function rowLayoutClass(layout?: TableRowLayout): string | undefined {
  if (layout === "truncate") return styles["TableCell--truncate"];
  if (layout === "fixed") return styles["TableCell--fixed"];
  if (layout === "wrap") return styles["TableCell--wrap"];
  return styles["TableCell--wrap"];
}

export interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cell padding + row height — spacious (40px) or dense (32px). Default: spacious. */
  density?: TableDensity;
  /**
   * Internal dividers between cells.
   * - `grid` — horizontal + vertical (default)
   * - `rows` — horizontal row lines only
   * - `none` — no internal lines; outer frame from TableRoot remains
   */
  lines?: TableLines;
  className?: string;
  children?: React.ReactNode;
}

/** Scroll + border shell around a {@link Table}. */
export const TableRoot = forwardRef<HTMLDivElement, TableRootProps>(function TableRoot(
  { density = "spacious", lines = "grid", className, children, ...rest },
  ref,
) {
  const classNames = [styles.TableRoot, densityClass(density), linesClass(lines), className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classNames} {...rest}>
      {children}
    </div>
  );
});

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TableElement = forwardRef<HTMLTableElement, TableProps>(function TableElement(
  { className, children, ...rest },
  ref,
) {
  const classNames = [styles.Table, className].filter(Boolean).join(" ");
  return (
    <table ref={ref} className={classNames} {...rest}>
      {children}
    </table>
  );
});

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ className, children, ...rest }, ref) {
    const classNames = [styles.TableHeader, className].filter(Boolean).join(" ");
    return (
      <thead ref={ref} className={classNames} {...rest}>
        {children}
      </thead>
    );
  },
);

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, children, ...rest },
  ref,
) {
  const classNames = [styles.TableBody, className].filter(Boolean).join(" ");
  return (
    <tbody ref={ref} className={classNames} {...rest}>
      {children}
    </tbody>
  );
});

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, children, ...rest },
  ref,
) {
  const classNames = [styles.TableRow, className].filter(Boolean).join(" ");
  return (
    <tr ref={ref} className={classNames} {...rest}>
      {children}
    </tr>
  );
});

export interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: TableCellAlign;
  className?: string;
  children?: React.ReactNode;
}

export const TableHeadCell = forwardRef<HTMLTableCellElement, TableHeadCellProps>(
  function TableHeadCell({ align, className, children, ...rest }, ref) {
    const classNames = [styles.TableHeadCell, alignClass("TableHeadCell", align), className]
      .filter(Boolean)
      .join(" ");
    return (
      <th ref={ref} className={classNames} scope="col" {...rest}>
        {children}
      </th>
    );
  },
);

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableCellAlign;
  rowLayout?: TableRowLayout;
  className?: string;
  children?: React.ReactNode;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, rowLayout = "wrap", className, children, ...rest },
  ref,
) {
  const classNames = [
    styles.TableCell,
    rowLayoutClass(rowLayout),
    alignClass("TableCell", align),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td ref={ref} className={classNames} {...rest}>
      <span className={styles["TableCell__inner"]}>{children}</span>
    </td>
  );
});

/** Composable table parts — use with {@link TableRoot} for manual markup or {@link SimpleTable} for TanStack. */
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
}

/**
 * TanStack-powered table with Cuboid styling. Pass column defs and row data;
 * extend with sorting, selection, etc. via TanStack APIs on a custom build later.
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
}: SimpleTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
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
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
