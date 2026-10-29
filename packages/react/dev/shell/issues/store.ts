import type { Checked } from "./check";

/** A check's answer, and when it was got. */
export type Saved = Checked;

const KEY = "cuboid-shell/checks";

type Stored = { hash: string; results: Record<string, Saved> };

/** What storage holds that is still true: nothing if the source has changed since (`hash`), or if what is there cannot be read. */
export function loadChecks(storage: Pick<Storage, "getItem"> | undefined, hash: string): Record<string, Saved> {
  try {
    const stored = JSON.parse(storage?.getItem(KEY) ?? "null") as Stored | null;
    return stored && stored.hash === hash && stored.results ? stored.results : {};
  } catch {
    return {};
  }
}

/** Adds one component's answer, starting afresh if what was saved is of other source. Storage that is full or off is no loss: it is a cache. */
export function saveCheck(storage: Pick<Storage, "getItem" | "setItem"> | undefined, hash: string, name: string, saved: Saved) {
  try {
    const results = { ...loadChecks(storage, hash), [name]: saved };
    storage?.setItem(KEY, JSON.stringify({ hash, results } satisfies Stored));
  } catch {
    // Not saved; asked for again next time.
  }
}

export function forgetChecks(storage: Pick<Storage, "removeItem"> | undefined) {
  try {
    storage?.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}

/** `3 min ago`: how long since, for a person reading it. */
export function ago(then: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
