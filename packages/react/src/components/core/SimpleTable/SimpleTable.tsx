import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type SortingState,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import { ActionMenu } from "../ActionMenu";
import { Table } from "../Table";
import type { TableCellAlign, TableDensity, TableLayout, TableLines, TableRowLayout, TableSort } from "../Table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    rowLayout?: TableRowLayout;
    align?: TableCellAlign;
    /** CSS width for `<col>` — e.g. `28%`, `10rem`, `120px`, `max-content`. Omit for flexible remainder. */
    width?: string;
  }
}

const sortOf = <TData,>(column: Column<TData, unknown>): TableSort => column.getIsSorted() || "none";

export interface SimpleTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** What every cell does with content that does not fit, unless its column has a `meta.rowLayout` (see `Table`). */
  rowLayout?: TableRowLayout;
  /** How the columns are sized (see `Table`). Follows `rowLayout` unless given. */
  layout?: TableLayout;
  /** Cell padding and row height (see `Table`). */
  density?: TableDensity;
  /** Internal cell dividers (see `Table`). */
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
  rowLayout,
  layout,
  density,
  lines,
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
    <Table density={density} lines={lines} rowLayout={rowLayout} layout={layout} wrapperClassName={className} className={tableClassName}>
        <colgroup>
          {table.getAllLeafColumns().map((column) => {
            const width = column.columnDef.meta?.width;
            return <col key={column.id} style={width ? { width } : undefined} />;
          })}
        </colgroup>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortable = enableSorting && header.column.getCanSort();
                const sort = sortable ? sortOf(header.column) : undefined;
                return (
                  <Table.HeadCell
                    key={header.id}
                    align={header.column.columnDef.meta?.align}
                    sort={sort}
                    menuLabel={`${header.column.id} column options`}
                    menu={
                      sortable ? (
                        <>
                          <ActionMenu.Item onClick={() => header.column.toggleSorting(false)}>Sort ascending</ActionMenu.Item>
                          <ActionMenu.Item onClick={() => header.column.toggleSorting(true)}>Sort descending</ActionMenu.Item>
                          {sort !== "none" ? <ActionMenu.Item onClick={() => header.column.clearSorting()}>Clear sort</ActionMenu.Item> : null}
                        </>
                      ) : undefined
                    }
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.HeadCell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id} align={cell.column.columnDef.meta?.align} rowLayout={cell.column.columnDef.meta?.rowLayout}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
    </Table>
  );
}

export type { ColumnDef, Row, TanStackTable };
