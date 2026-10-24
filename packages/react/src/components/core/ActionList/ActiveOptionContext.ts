import { createContext, useContext } from "react";

/**
 * What a menu with a search field shares between the field and its list. The field keeps focus and points at one option with
 * `aria-activedescendant` (`activeId`); the list is the `listId` it controls. Null outside a menu that has a search field.
 */
export type ActiveOptionContextValue = {
  listId: string;
  activeId: string | undefined;
  setActiveId: (id: string | undefined) => void;
};

export const ActiveOptionContext = createContext<ActiveOptionContextValue | null>(null);
export const useActiveOptionContext = () => useContext(ActiveOptionContext);
