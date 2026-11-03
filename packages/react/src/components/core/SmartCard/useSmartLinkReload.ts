import { useCallback } from "react";
import { useSmartLinkStore } from "./SmartLinkContext";
import { useSmartLinkEvents } from "./useSmartLinkEvents";

/** Resolves a link again, keeping what is shown until the new answer comes, and tells the host (`reloaded`). */
export function useSmartLinkReload(url: string): () => void {
  const store = useSmartLinkStore();
  const emit = useSmartLinkEvents();
  return useCallback(() => {
    emit({ type: "reloaded", url });
    void store.reload(url);
  }, [store, emit, url]);
}
