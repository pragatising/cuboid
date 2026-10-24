import { useSyncExternalStore } from "react";
import tokenTrees from "@sragatiping/cuboid-primitives";
import type { ModeName, Tokens } from "@sragatiping/cuboid-primitives";

/**
 * Runtime mode switching (ADR-04 amendment). The token pipeline emits one
 * fully resolved tree per mode (`tokenTrees.light`, `tokenTrees.dark`); the
 * only runtime state is WHICH mode is active. It lives in this tiny external
 * store — deliberately not a React context/provider, so there is no provider
 * tree to mount and a component can read tokens from anywhere.
 *
 * Only `setMode` re-renders token readers (`useSyncExternalStore` bails out
 * when the snapshot is unchanged). Theme *values* never change at runtime —
 * they were fixed by the consuming app's token build — so, unlike a themed
 * context, nothing re-renders for any reason other than a mode toggle.
 *
 * Kept in one file with no relative imports so it can be exercised directly
 * under `node --test` (there is no DOM/test runner in this package yet).
 */

const modes = Object.keys(tokenTrees) as ModeName[];

let currentMode: ModeName = modes[0];
const listeners = new Set<() => void>();

/** The active mode. Safe to call outside React (e.g. to persist the choice). */
export function getMode(): ModeName {
  return currentMode;
}

/**
 * Switch the active mode; every mounted `useTokens()` / `useMode()` re-renders
 * once. For SSR, call this with the request's mode BEFORE rendering so the
 * server output and the first client render agree (no wrong-mode flash).
 */
export function setMode(mode: ModeName): void {
  if (!modes.includes(mode)) {
    throw new Error(`Unknown mode "${mode}". Available modes: ${modes.join(", ")}.`);
  }
  if (mode === currentMode) return;
  currentMode = mode;
  // The token build's CSS publishes each mode's variables under `[data-mode="<mode>"]` (light is the `:root` default), so the
  // attribute is what switches component CSS that reads them.
  if (typeof document !== "undefined") document.documentElement.setAttribute("data-mode", mode);
  listeners.forEach((listener) => listener());
}

export function subscribeToMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Subscribe to the active mode only (e.g. a light/dark toggle button). */
export function useMode(): ModeName {
  return useSyncExternalStore(subscribeToMode, getMode, getMode);
}

/** The resolved token tree for the active mode: `useTokens().divider.color.default`. */
export function useTokens(): Tokens {
  return tokenTrees[useMode()];
}
