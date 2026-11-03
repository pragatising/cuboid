import { createContext, useContext } from "react";
import type { TableRowLayout } from "./types";

/** What the root hands every cell: how content that does not fit is handled, unless a cell says otherwise. */
export type TableContextValue = { rowLayout: TableRowLayout };

export const TableContext = createContext<TableContextValue>({ rowLayout: "wrap" });

export const useTableContext = () => useContext(TableContext);
