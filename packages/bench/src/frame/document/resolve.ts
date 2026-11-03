import type React from "react";
import { library } from "virtual:bench";

/** `Menu.Item` is the `Item` of `Menu`: a tag as the examples write it, to the component the library exports by that name. */
export function resolve(tag: string): React.ElementType | undefined {
  let found: unknown = library;
  for (const part of tag.split(".")) found = (found as Record<string, unknown> | undefined)?.[part];
  return found as React.ElementType | undefined;
}
