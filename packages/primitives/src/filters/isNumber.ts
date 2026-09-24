import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "number". Matches Primer's filters/isNumber.ts.
 * Pulled forward from Group 5 — floatToPixel.ts (dimension group) depends
 * on it.
 */
export function isNumber(token: TransformedToken): boolean {
  return token.$type === "number";
}
