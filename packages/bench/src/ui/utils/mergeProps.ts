import { clsx } from "clsx";

type EventHandler = (...args: unknown[]) => void;
type ClassValue = Parameters<typeof clsx>[number];

/**
 * Given object types A and B: every property of A that is not also in B, plus all of B.
 * The type of `mergeProps(a, b)`.
 */
export type Merge<A = object, B = object> = Omit<A, keyof B> & B;

/**
 * Applies cuboid's rules for merging a component's own props (`a`) with the
 * consumer's (`b`) — see "Merge shared props intentionally" in docs/style.md.
 *
 * - `className`: joined with `clsx`.
 * - Event handlers (`onX`): the component's runs first; the consumer's runs
 *   unless the event was default-prevented.
 * - `style`: component styles first, consumer's second, so the consumer wins.
 * - Anything else: the consumer's value wins.
 */
export function mergeProps<A extends object, B extends object = A>(a: A, b: B): Merge<A, B> {
  const merged = { ...a } as Record<string, unknown>;

  for (const [key, value] of Object.entries(b)) {
    if (!(key in merged)) {
      merged[key] = value;
      continue;
    }

    const existing = merged[key];

    if (key === "className") {
      merged[key] = clsx(existing as ClassValue, value as ClassValue);
    } else if (isEventHandlerKey(key) && isEventHandler(existing)) {
      if (isEventHandler(value)) merged[key] = composeEventHandlers(existing, value);
      else if (value !== undefined) merged[key] = value;
    } else if (key === "style") {
      merged[key] = { ...(isObject(existing) ? existing : {}), ...(isObject(value) ? value : {}) };
    } else {
      merged[key] = value;
    }
  }

  return merged as Merge<A, B>;
}

function composeEventHandlers(a: EventHandler, b: EventHandler): EventHandler {
  return (...args) => {
    a(...args);
    const event = args[0] as { defaultPrevented?: boolean } | undefined;
    if (!event?.defaultPrevented) b(...args);
  };
}

const isEventHandlerKey = (key: string) => key.startsWith("on");
const isEventHandler = (value: unknown): value is EventHandler => typeof value === "function";
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
