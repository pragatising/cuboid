import type { Value } from "../../engine/types";

/**
 * What is set on elements of the example drawn in this page, by where each is written in the example's file (`"line:column"` of its opening `<`, as the JSX
 * transform in development reports it): what the pane changed on that instance, and on no other. `undefined` takes a prop off, so it goes back to its default.
 */
export type Patches = Record<string, Record<string, Value | undefined>>;

let current: Patches = {};
let version = 0;
const listeners = new Set<() => void>();

export const subscribe = (listener: () => void) => (listeners.add(listener), () => void listeners.delete(listener));
/** Changes whenever the patches do: what an example drawn here reads to be drawn again. */
export const patchesVersion = () => version;

/** Tells the page what is set on each instance now. Bench calls this as a prop is changed in its pane; the example is drawn again, not loaded again. */
export function setPatches(next: Patches) {
  current = next;
  version += 1;
  listeners.forEach((listener) => listener());
}

/** What is set on the element written at this place, if anything. */
export const patchAt = (line: number, column: number): Record<string, Value | undefined> | undefined => current[`${line}:${column}`];
