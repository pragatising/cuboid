import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "typography". Matches Primer's
 * filters/isTypography.ts.
 */
export function isTypography(token: TransformedToken): boolean {
  return token.$type === "typography";
}
