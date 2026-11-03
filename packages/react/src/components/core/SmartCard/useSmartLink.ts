import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { LinkSnapshot } from "./linkData";
import { useSmartLinkStore } from "./SmartLinkContext";
import { useSmartLinkReload } from "./useSmartLinkReload";

export type UseSmartLinkResult = LinkSnapshot & {
  /** Resolve the link again. The data already shown stays until the new data arrives. */
  reload: () => void;
};

/** The state of a link: `pending` until it is first asked for, then whatever the client made of it. */
export function useSmartLink(url: string): UseSmartLinkResult {
  const store = useSmartLinkStore();
  const snapshot = useSyncExternalStore(
    useCallback((listener) => store.subscribe(url, listener), [store, url]),
    () => store.get(url),
    () => store.get(url),
  );
  useEffect(() => {
    void store.resolve(url);
  }, [store, url]);
  const reload = useSmartLinkReload(url);
  return { ...snapshot, reload };
}
