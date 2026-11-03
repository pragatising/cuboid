import { createContext, useContext } from "react";
import type { UseSmartLinkResult } from "./useSmartLink";

/** The link a `SmartCard` is showing, for the parts inside it. */
export type SmartCardContextValue = UseSmartLinkResult & { url: string };

export const SmartCardContext = createContext<SmartCardContextValue | null>(null);

export function useSmartCardContext(part: string): SmartCardContextValue {
  const value = useContext(SmartCardContext);
  if (!value) throw new Error(`${part} must be used inside a SmartCard`);
  return value;
}
