import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "duration". Matches Primer's
 * filters/isDuration.ts.
 */
export function isDuration(token: TransformedToken): boolean {
  return token.$type === "duration";
}
