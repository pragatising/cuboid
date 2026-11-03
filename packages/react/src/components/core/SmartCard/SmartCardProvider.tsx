import React, { useMemo, useRef } from "react";
import { genericClient, type SmartLinkClient } from "./client";
import type { SmartLinkEvent } from "./events";
import type { LinkAction, LinkData } from "./linkData";
import { SmartLinkContext, SmartLinkHostContext, type SmartLinkHost } from "./SmartLinkContext";
import { createSmartLinkStore, type SmartLinkStore } from "./store";

export type SmartCardProviderProps = {
  /** How URLs are resolved. Put the clients you know in front of `genericClient` with `composeClients`. @default genericClient */
  client?: SmartLinkClient;
  /** A store of your own, to share resolved links beyond this subtree. Wins over `client`. */
  store?: SmartLinkStore;
  /** Told what happens to the links below: they resolve, are followed, have an action pressed or are reloaded. */
  onEvent?: (event: SmartLinkEvent) => void;
  /** Carries out an action that is not a link (one with no `href`). An action no one handles is not drawn as a button. */
  onAction?: (action: LinkAction, link: LinkData | undefined) => void;
  children: React.ReactNode;
};

/** Gives every `SmartCard` and `useSmartLink` below it one client and one cache of resolved links, and tells the host what happens to them. */
export function SmartCardProvider({ client = genericClient, store, onEvent, onAction, children }: SmartCardProviderProps) {
  // What the host passed last, read when it is needed: a new function each render must not make a new store or a new context value.
  const latest = useRef({ onEvent, onAction });
  latest.current = { onEvent, onAction };

  const value = useMemo(
    () =>
      store ??
      createSmartLinkStore(client, {
        onSettled: (url, { status, data }) => {
          if (status !== "pending" && status !== "resolving") latest.current.onEvent?.({ type: "resolved", url, status, data });
        },
      }),
    [store, client],
  );
  const host = useMemo<SmartLinkHost>(
    () => ({
      emit: (event) => latest.current.onEvent?.(event),
      // Whether there is a handler is part of what is drawn, so it is read as the host has it now.
      get onAction() {
        return latest.current.onAction;
      },
    }),
    [],
  );
  return (
    <SmartLinkContext.Provider value={value}>
      <SmartLinkHostContext.Provider value={host}>{children}</SmartLinkHostContext.Provider>
    </SmartLinkContext.Provider>
  );
}
