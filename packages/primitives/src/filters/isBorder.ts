import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "border". Matches Primer's
 * filters/isBorder.ts.
 */
export function isBorder(token: TransformedToken): boolean {
  return token.$type === "border";
}
