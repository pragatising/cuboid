import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "gradient". Matches Primer's
 * filters/isGradient.ts.
 */
export function isGradient(token: TransformedToken): boolean {
  return (token.$type ?? (token as { type?: string }).type) === "gradient";
}
