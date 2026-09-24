import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "dimension". Matches Primer's
 * filters/isDimension.ts.
 */
export function isDimension(token: TransformedToken): boolean {
  return token.$type === "dimension";
}
