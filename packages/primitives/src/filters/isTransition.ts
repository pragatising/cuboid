import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "transition". Matches Primer's
 * filters/isTransition.ts.
 */
export function isTransition(token: TransformedToken): boolean {
  return token.$type === "transition";
}
