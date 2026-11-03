import React from "react";
import { ActionMenu } from "../../ActionMenu";
import type { ColumnMove, ColumnSort, TableColumn, TableColumnLabels } from "./types";

export type TableColumnMenuProps = {
  column: TableColumn;
  sort: ColumnSort;
  labels: TableColumnLabels;
  /** How many columns are shown, and where this one is among them. */
  position: { index: number; count: number };
  movable: boolean;
  hideable: boolean;
  onSort: (sort: ColumnSort) => void;
  onMove: (to: ColumnMove) => void;
  onHide: () => void;
};

/**
 * The menu every column has: sort it, move it, hide it (Figma's column options), then whatever the column adds of its own. Each group is there
 * only when it applies, and an item that means nothing now (clear a sort that is not set, move left from the first place) is disabled, not gone,
 * so the menu does not change shape under the pointer.
 */
export function TableColumnMenu({ column, sort, labels, position, movable, hideable, onSort, onMove, onHide }: TableColumnMenuProps) {
  const sorted = sort?.id === column.id;
  const first = position.index === 0;
  const last = position.index === position.count - 1;
  const layout = movable || hideable;
  return (
    <>
      {column.sortable !== false ? (
        <>
          <ActionMenu.Item onClick={() => onSort({ id: column.id, direction: "asc" })}>{labels.sortAscending}</ActionMenu.Item>
          <ActionMenu.Item onClick={() => onSort({ id: column.id, direction: "desc" })}>{labels.sortDescending}</ActionMenu.Item>
          <ActionMenu.Item disabled={!sorted} onClick={() => onSort(null)}>
            {labels.clearSort}
          </ActionMenu.Item>
        </>
      ) : null}
      {layout ? (
        <ActionMenu.Section label={labels.layout}>
          {movable ? (
            <>
              <ActionMenu.Item disabled={first} onClick={() => onMove("left")}>
                {labels.moveLeft}
              </ActionMenu.Item>
              <ActionMenu.Item disabled={last} onClick={() => onMove("right")}>
                {labels.moveRight}
              </ActionMenu.Item>
              <ActionMenu.Item disabled={last} onClick={() => onMove("end")}>
                {labels.moveToEnd}
              </ActionMenu.Item>
              <ActionMenu.Item disabled={first} onClick={() => onMove("start")}>
                {labels.moveToStart}
              </ActionMenu.Item>
            </>
          ) : null}
          {hideable ? (
            <ActionMenu.Item disabled={position.count === 1} onClick={onHide}>
              {labels.hide}
            </ActionMenu.Item>
          ) : null}
        </ActionMenu.Section>
      ) : null}
      {column.menu}
    </>
  );
}
