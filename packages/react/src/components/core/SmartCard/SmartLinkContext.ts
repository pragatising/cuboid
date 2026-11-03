import { createContext, useContext } from "react";
import { genericClient } from "./client";
import type { SmartLinkEvent } from "./events";
import type { LinkAction, LinkData } from "./linkData";
import { createSmartLinkStore, type SmartLinkStore } from "./store";

/** The store a `SmartCard.Provider` makes. Without one, links resolve through a shared store that only has `genericClient`. */
export const SmartLinkContext = createContext<SmartLinkStore | null>(null);

let defaultStore: SmartLinkStore | undefined;

export function useSmartLinkStore(): SmartLinkStore {
  const provided = useContext(SmartLinkContext);
  return provided ?? (defaultStore ??= createSmartLinkStore(genericClient));
}

/** What the host handed the provider to be told, and to carry out. Stable: it reads the latest of what it was given. */
export type SmartLinkHost = {
  emit: (event: SmartLinkEvent) => void;
  /** The host's handler for actions that are not links; undefined when it gave none. */
  onAction: ((action: LinkAction, link: LinkData | undefined) => void) | undefined;
};

const NO_HOST: SmartLinkHost = { emit: () => undefined, onAction: undefined };

export const SmartLinkHostContext = createContext<SmartLinkHost>(NO_HOST);
export const useSmartLinkHost = () => useContext(SmartLinkHostContext);
