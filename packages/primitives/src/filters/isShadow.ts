import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "shadow". Matches Primer's
 * filters/isShadow.ts.
 */
export function isShadow(token: TransformedToken): boolean {
  return token.$type === "shadow";
}
