import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "cubicBezier". Matches Primer's
 * filters/isCubicBezier.ts.
 */
export function isCubicBezier(token: TransformedToken): boolean {
  return (token.$type ?? (token as { type?: string }).type) === "cubicBezier";
}
