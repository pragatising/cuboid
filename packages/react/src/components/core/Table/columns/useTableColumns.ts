import { createElement, useCallback, useMemo } from "react";
import type React from "react";
import { useControllableState } from "../../../../behaviors";
import type { TableCellAlign, TableSort } from "../types";
import { DEFAULT_LABELS } from "./constants";
import { moveColumn, sortRows, visibleIds } from "./columnState";
import { TableColumnMenu } from "./TableColumnMenu";
import type { ColumnMove, ColumnSort, TableColumn, TableColumnLabels } from "./types";

export type TableColumnsOptions = {
  /** The ids in the order they are shown (controlled), and the order they start in. @default the order of `columns` */
  order?: string[];
  defaultOrder?: string[];
  onOrderChange?: (order: string[]) => void;
  /** The ids that are hidden (controlled), and the ones hidden to begin with. */
  hidden?: string[];
  defaultHidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
  /** How the table is sorted (controlled; null is not sorted), and how it starts. */
  sort?: ColumnSort;
  defaultSort?: ColumnSort;
  onSortChange?: (sort: ColumnSort) => void;
  /** Whether a column can be moved, or hidden, from its menu. @default true */
  movable?: boolean;
  hideable?: boolean;
  /** The words of the standard menu, where it is not in English or not in this voice. */
  labels?: Partial<TableColumnLabels>;
};

/** What a header cell needs, from the column and the state: spread it on `Table.HeadCell`. */
export type HeadCellProps = {
  align: TableCellAlign | undefined;
  sort: TableSort | undefined;
  menu: React.ReactNode;
  menuLabel: string;
};

export type HeadCellOptions = {
  /** Leave the standard items out, so the menu is only the column's own. @default true */
  standard?: boolean;
  /** A menu of its own instead of this column's (and the standard one). */
  menu?: React.ReactNode;
};

const NONE: string[] = [];

/**
 * The state of a table's columns, and the header cell for each: what order they are in, which are hidden, how the table is sorted. It is the
 * one place those rules live, so a table that sorts, moves and hides its columns needs the columns and one line for each header, not the menu,
 * the state and the comparisons written out. Each state is controlled or not, as any in the library is.
 *
 * `headCell(column)` is the props of a `Table.HeadCell`: its alignment, its sort and its menu (the standard sort, layout and hide items, then
 * the column's own `menu`). Put a different menu on one column with `headCell(column, { menu })`, or drop the standard items with
 * `{ standard: false }`. `sortRows` puts rows in the sort's order, for a table that holds its rows in memory.
 */
export function useTableColumns(columns: TableColumn[], options: TableColumnsOptions = {}) {
  const { movable = true, hideable = true, labels: given } = options;
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...given }), [given]);
  const ids = useMemo(() => columns.map((column) => column.id), [columns]);

  const [order, setOrder] = useControllableState<string[]>({ value: options.order, defaultValue: options.defaultOrder ?? ids, onChange: options.onOrderChange, name: "order" });
  const [hidden, setHidden] = useControllableState<string[]>({ value: options.hidden, defaultValue: options.defaultHidden ?? NONE, onChange: options.onHiddenChange, name: "hidden" });
  const [sort, setSort] = useControllableState<ColumnSort>({ value: options.sort, defaultValue: options.defaultSort ?? null, onChange: options.onSortChange, name: "sort" });

  // The columns as they are now: in the order, those the order does not know after it (a column added later), those it names but are gone left out.
  const ordered = useMemo(() => {
    const known = order.filter((id) => ids.includes(id));
    return [...known, ...ids.filter((id) => !known.includes(id))].map((id) => columns.find((column) => column.id === id)!);
  }, [order, ids, columns]);
  const visible = useMemo(() => {
    const shown = visibleIds(
      ordered.map((column) => column.id),
      hidden,
    );
    return ordered.filter((column) => shown.includes(column.id));
  }, [ordered, hidden]);

  // From the order as it is shown, which also holds a column the stored order does not know yet.
  const move = useCallback((id: string, to: ColumnMove) => setOrder(moveColumn(ordered.map((column) => column.id), hidden, id, to)), [ordered, hidden, setOrder]);
  const hide = useCallback((id: string) => setHidden((current) => (current.includes(id) ? current : [...current, id])), [setHidden]);
  const show = useCallback((id: string) => setHidden((current) => current.filter((other) => other !== id)), [setHidden]);
  const showAll = useCallback(() => setHidden(NONE), [setHidden]);

  const headCell = useCallback(
    (which: TableColumn | string, { standard = true, menu }: HeadCellOptions = {}): HeadCellProps => {
      const column = typeof which === "string" ? ordered.find((other) => other.id === which) : which;
      if (!column) throw new Error(`useTableColumns: there is no column "${String(which)}"`);
      const index = visible.findIndex((other) => other.id === column.id);
      const standardMenu = standard
        ? createElement(TableColumnMenu, {
            column,
            sort,
            labels,
            position: { index, count: visible.length },
            movable,
            hideable,
            onSort: setSort,
            onMove: (to) => move(column.id, to),
            onHide: () => hide(column.id),
          })
        : column.menu;
      return {
        align: column.align,
        sort: column.sortable === false ? undefined : sort?.id === column.id ? sort.direction : "none",
        menu: menu ?? standardMenu,
        menuLabel: typeof column.label === "string" ? `${column.label} ${labels.options.toLowerCase()}` : labels.options,
      };
    },
    [ordered, visible, sort, labels, movable, hideable, setSort, move, hide],
  );

  const sortedRows = useCallback(<Row,>(rows: readonly Row[], valueOf: (row: Row, id: string) => unknown) => sortRows(rows, sort, valueOf), [sort]);

  return { columns: ordered, visible, hidden, sort, setSort, move, hide, show, showAll, headCell, sortRows: sortedRows };
}
