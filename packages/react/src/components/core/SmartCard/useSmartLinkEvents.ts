import type { SmartLinkEvent } from "./events";
import { useSmartLinkHost } from "./SmartLinkContext";

/** Tells the host's `onEvent` something. Does nothing without a `SmartCard.Provider` that has one. The same function every render. */
export function useSmartLinkEvents(): (event: SmartLinkEvent) => void {
  return useSmartLinkHost().emit;
}
