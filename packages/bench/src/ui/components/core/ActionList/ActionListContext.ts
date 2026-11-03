import { createContext, useContext } from "react";

/** `single`: the items are radios (one is selected). `multiple`: checkboxes. Unset: plain actions. */
export type ActionListSelectionMode = "single" | "multiple";

/** `menu`: a list of actions. `listbox`: a list to choose from (a filterable list, an autocomplete's suggestions). */
export type ActionListRole = "menu" | "listbox";

export type ActionListContextValue = { selectionMode?: ActionListSelectionMode; role: ActionListRole };

export const ActionListContext = createContext<ActionListContextValue>({ role: "menu" });
export const useActionListContext = () => useContext(ActionListContext);
