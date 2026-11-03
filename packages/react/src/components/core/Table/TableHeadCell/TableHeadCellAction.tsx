import React from "react";
import { ActionMenu } from "../../ActionMenu";
import { Icon } from "../../Icon";
import type { IconName } from "../../Icon";
import { IconButton } from "../../IconButton";
import type { TableSort } from "../types";

const ICON: Record<TableSort, IconName> = { none: "more_vert", asc: "arrow_upward", desc: "arrow_downward" };

export type TableHeadCellActionProps = {
  sort: TableSort;
  menu: React.ReactNode;
  label: string;
};

/**
 * The button at the end of a header: it opens the column's menu. Its icon is the sort direction once the column is sorted
 * and the kebab until then (the stylesheet shows the kebab only while the header is hovered or focused).
 */
export function TableHeadCellAction({ sort, menu, label }: TableHeadCellActionProps) {
  return (
    <ActionMenu
      aria-label={label}
      trigger={
        <IconButton
          data-component="Table.HeadCell.Action"
          data-sort={sort}
          variant="ghost"
          size="sm"
          aria-label={label}
          disableTooltip
          icon={<Icon name={ICON[sort]} size="xs" />}
        />
      }
    >
      {menu}
    </ActionMenu>
  );
}

/** A sorted column with no menu still shows which way it is sorted. */
export function TableHeadCellSortMark({ sort }: { sort: Exclude<TableSort, "none"> }) {
  return <Icon data-component="Table.HeadCell.SortMark" name={ICON[sort]} size="xs" />;
}
