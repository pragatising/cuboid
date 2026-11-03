import { createContext, useContext, useSyncExternalStore } from "react";

/**
 * The platform categories that change how keyboard shortcut keys are named.
 *
 * - `apple`: macOS and iOS/iPadOS: Command and Option, with symbols (⌘ ⌥ ⇧ ⌃).
 * - `windows`: the Windows (Meta) key is "Win".
 * - `other`: Linux, Android…: the Meta key has no consistent name.
 */
export type Platform = "apple" | "windows" | "other";

// The platform never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

function detect(): Platform {
  if (typeof navigator === "undefined") return "other";
  const platform = navigator.platform ?? "";
  const agent = navigator.userAgent ?? "";
  if (/^mac/i.test(platform) || /iphone|ipad|ipod/i.test(platform + agent)) return "apple";
  if (/^win/i.test(platform)) return "windows";
  return "other";
}

// A safe default for the server, which cannot detect it.
const serverSnapshot = (): Platform => "other";

const OverrideContext = createContext<Platform | null>(null);

/** Force a platform for a subtree: tests and Storybook, to preview how shortcuts read on a platform you are not on. */
export const PlatformProvider = OverrideContext.Provider;

/**
 * The platform shortcut keys should be named for. SSR-safe: the server renders `"other"` and the client reads the real
 * value. A {@link PlatformProvider} above takes priority.
 */
export function usePlatform(): Platform {
  const override = useContext(OverrideContext);
  const detected = useSyncExternalStore(subscribe, detect, serverSnapshot);
  return override ?? detected;
}
