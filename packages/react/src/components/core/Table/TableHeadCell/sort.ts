import type React from "react";
import type { TableSort } from "../types";

const ARIA_SORT: Record<TableSort, React.AriaAttributes["aria-sort"]> = { none: "none", asc: "ascending", desc: "descending" };

/** The `aria-sort` of a column header: absent for a column that cannot be sorted (no `sort`). */
export const ariaSort = (sort: TableSort | undefined) => (sort === undefined ? undefined : ARIA_SORT[sort]);
