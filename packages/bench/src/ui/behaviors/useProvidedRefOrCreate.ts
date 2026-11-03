import { useRef } from "react";
import type React from "react";

type Provided<T> = React.Ref<T> | undefined;

/** A ref object whose `current` is also forwarded to a callback ref (or object ref) the caller provided. */
function createForwardingRef<T>(read: () => Provided<T>): React.RefObject<T | null> {
  let value: T | null = null;
  return Object.defineProperty({} as React.RefObject<T | null>, "current", {
    get: () => value,
    set: (next: T | null) => {
      value = next;
      const provided = read();
      if (typeof provided === "function") provided(next);
      else if (provided) (provided as React.RefObject<T | null>).current = next;
    },
  });
}

/**
 * The ref a behavior needs for a DOM element, honouring a ref the caller gave the component.
 *
 * A behavior often has to act on a real element but the component also exposes `ref` to its consumer. This returns a
 * ref *object* to put on the element: the caller's own object ref if it passed one, otherwise a ref the hook creates
 * that also forwards to the caller's callback ref. Either way the behavior can read `.current`, and the consumer's
 * `ref` still works. (Per `docs/behaviours.md`: "a ref must be accepted as an optional setting to the hook".)
 */
export function useProvidedRefOrCreate<T>(provided?: Provided<T>): React.RefObject<T | null> {
  const latest = useRef(provided);
  latest.current = provided;
  const own = useRef<React.RefObject<T | null> | null>(null);
  if (own.current === null) own.current = createForwardingRef(() => latest.current);

  return provided && typeof provided === "object" ? (provided as React.RefObject<T | null>) : own.current;
}
