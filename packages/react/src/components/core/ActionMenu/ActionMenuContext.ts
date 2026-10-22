import { createContext, useContext } from "react";

/** `single`: the items are radios (one is selected). `multiple`: checkboxes. Unset: plain actions. */
export type ActionMenuSelectionMode = "single" | "multiple";

export const ActionMenuContext = createContext<{ selectionMode?: ActionMenuSelectionMode }>({});
export const useActionMenuContext = () => useContext(ActionMenuContext);
