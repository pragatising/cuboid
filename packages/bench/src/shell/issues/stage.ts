/**
 * Where examples are drawn to be checked. It is on screen, because axe leaves out what is off screen (it cannot say what colour
 * something is behind unless it can see it), so an off-screen audit would call everything's contrast fine. `CheckPreview` is that place:
 * a small card docked in a corner, shown while a check runs, with what is being checked in it.
 */
let host: HTMLElement | null = null;
let checking: string | null = null;
const listeners = new Set<() => void>();

export const getHost = () => host;
export const setHost = (element: HTMLElement | null) => {
  host = element;
};
export const getChecking = () => checking;
export const setChecking = (name: string | null) => {
  checking = name;
  listeners.forEach((listener) => listener());
};
export const subscribeChecking = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
