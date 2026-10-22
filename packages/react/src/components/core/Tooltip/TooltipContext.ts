import { createContext, useContext } from "react";

/**
 * Set by a `Tooltip` for everything inside it, so a component that would add a tooltip of its own (an `IconButton` that
 * names itself with one) can see it is already inside one and not add a second. A component that must not inherit it
 * (a menu item inside a tooltipped trigger) provides `{}`.
 */
export const TooltipContext = createContext<{ tooltipId?: string }>({});

export const useTooltipContext = () => useContext(TooltipContext);
