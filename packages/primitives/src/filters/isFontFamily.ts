import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "fontFamily". Matches Primer's
 * filters/isFontFamily.ts.
 */
export function isFontFamily(token: TransformedToken): boolean {
  return token.$type === "fontFamily";
}
