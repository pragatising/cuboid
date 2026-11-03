import { createContext, useContext } from "react";

export type TabsContextValue = {
  /** The `value` of the tab that is open. */
  value: string | undefined;
  select: (value: string) => void;
};

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.Tab must be rendered inside Tabs.");
  return context;
}
