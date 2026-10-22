import { useCallback, useEffect, useRef, useState } from "react";
import { isDev } from "../utils/isDev";

export type ControllableStateOptions<T> = {
  /** The controlled value. When it is not `undefined` the caller owns the state. */
  value?: T;
  /** The initial value when uncontrolled. */
  defaultValue: T;
  /** Called with the next value whenever it changes, controlled or not. */
  onChange?: (value: T) => void;
  /** What the state is called in the development warning. */
  name?: string;
};

/**
 * State that can be controlled or uncontrolled, behind one contract: `value` / `defaultValue` / `onChange`.
 *
 * - Controlled (`value !== undefined`): the caller owns the state, and `setValue` only asks for a change through `onChange`.
 * - Uncontrolled: the hook owns the state and also calls `onChange`, so a caller can observe it.
 * - `onChange` is not called when the next value equals the current one.
 * - `setValue` is stable, and takes a value or an updater like `useState`'s.
 *
 * Every `x` / `defaultX` / `onXChange` prop in the library goes through this (docs/style.md: "Prefer the
 * `useControllableState` hook").
 */
export function useControllableState<T>({ value, defaultValue, onChange, name = "value" }: ControllableStateOptions<T>) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : internal;

  // The latest of each, read by the stable setter. Written in an effect, not during render, so a render that never commits
  // cannot change what an event handler sees.
  const latest = useRef({ current, controlled, onChange });
  useEffect(() => {
    latest.current = { current, controlled, onChange };
  });

  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (isDev() && wasControlled.current !== controlled) {
      console.warn(
        `A component changed its ${name} from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${controlled ? "controlled" : "uncontrolled"}. Pick one for the lifetime of the component.`,
      );
    }
    wasControlled.current = controlled;
  }, [controlled, name]);

  const setValue = useCallback((next: T | ((previous: T) => T)) => {
    const { current: previous, controlled: isControlled, onChange: notify } = latest.current;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
    if (Object.is(resolved, previous)) return;
    if (!isControlled) {
      // Let a second call in the same tick (before React re-renders) build on this one. A controlled value is never
      // guessed at: the caller may refuse the change, and only a re-render with its value settles that.
      latest.current = { ...latest.current, current: resolved };
      setInternal(resolved);
    }
    notify?.(resolved);
  }, []);

  return [current, setValue] as const;
}
