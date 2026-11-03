import { createContext, useContext } from "react";

export type SegmentedControlContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  size: "sm" | "md" | "lg";
};

export const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

export function useSegmentedControlContext(): SegmentedControlContextValue {
  const context = useContext(SegmentedControlContext);
  if (!context) throw new Error("SegmentedControl.Item must be rendered inside a SegmentedControl.");
  return context;
}
