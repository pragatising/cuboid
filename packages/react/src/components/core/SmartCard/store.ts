import { SmartLinkError, type SmartLinkClient } from "./client";
import type { LinkSnapshot } from "./linkData";

export type SmartLinkStore = {
  /** The current snapshot for a URL. The same object until it changes, so it works with `useSyncExternalStore`. */
  get(url: string): LinkSnapshot;
  subscribe(url: string, listener: () => void): () => void;
  /** Resolve a URL if it has not been resolved. Concurrent calls share one request. */
  resolve(url: string): Promise<void>;
  /** Resolve again, keeping the old data on screen until the new data arrives. */
  reload(url: string): Promise<void>;
};

const PENDING: LinkSnapshot = { status: "pending" };

export type SmartLinkStoreOptions = {
  /** Called once each time a request ends, with what it ended in: a link shown in several places is one request, so one call. Not for a request a newer one replaced. */
  onSettled?: (url: string, snapshot: LinkSnapshot) => void;
};

export function createSmartLinkStore(client: SmartLinkClient, { onSettled }: SmartLinkStoreOptions = {}): SmartLinkStore {
  const snapshots = new Map<string, LinkSnapshot>();
  const listeners = new Map<string, Set<() => void>>();
  const inFlight = new Map<string, { controller: AbortController; done: Promise<void> }>();

  const get = (url: string) => snapshots.get(url) ?? PENDING;

  function set(url: string, snapshot: LinkSnapshot) {
    snapshots.set(url, snapshot);
    listeners.get(url)?.forEach((listener) => listener());
  }

  function start(url: string): Promise<void> {
    inFlight.get(url)?.controller.abort();
    const controller = new AbortController();
    const previous = snapshots.get(url);
    set(url, { status: "resolving", data: previous?.data });

    // A host's listener that throws must not turn a link that resolved into one that failed, nor stop the store: it is reported on its own.
    const settled = () => {
      try {
        onSettled?.(url, get(url));
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    };

    const done = client
      .resolve(url, { signal: controller.signal })
      .then(
        (data) => {
          if (controller.signal.aborted) return;
          set(url, data ? { status: "resolved", data } : { status: "fallback" });
          settled();
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const status = error instanceof SmartLinkError ? error.status : "errored";
          set(url, { status, data: previous?.data });
          settled();
        },
      )
      .finally(() => {
        if (inFlight.get(url)?.controller === controller) inFlight.delete(url);
      });

    inFlight.set(url, { controller, done });
    return done;
  }

  return {
    get,
    subscribe(url, listener) {
      const forUrl = listeners.get(url) ?? new Set();
      forUrl.add(listener);
      listeners.set(url, forUrl);
      return () => {
        forUrl.delete(listener);
      };
    },
    resolve(url) {
      const running = inFlight.get(url);
      if (running) return running.done;
      if (snapshots.has(url)) return Promise.resolve();
      return start(url);
    },
    reload: start,
  };
}
