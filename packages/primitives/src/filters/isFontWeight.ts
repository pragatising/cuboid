import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "fontWeight". Matches Primer's
 * filters/isFontWeight.ts.
 */
export function isFontWeight(token: TransformedToken): boolean {
  return token.$type === "fontWeight";
}
