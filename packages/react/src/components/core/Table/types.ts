import type { TABLE_ALIGNS, TABLE_DENSITIES, TABLE_LAYOUTS, TABLE_LINES, TABLE_ROW_LAYOUTS, TABLE_SORTS } from "./constants";

export type TableDensity = (typeof TABLE_DENSITIES)[number];
export type TableLines = (typeof TABLE_LINES)[number];
export type TableCellAlign = (typeof TABLE_ALIGNS)[number];
export type TableRowLayout = (typeof TABLE_ROW_LAYOUTS)[number];
export type TableSort = (typeof TABLE_SORTS)[number];
export type TableLayout = (typeof TABLE_LAYOUTS)[number];
