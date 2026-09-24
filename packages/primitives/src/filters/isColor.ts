import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token's $type is "color". Matches Primer's filters/isColor.ts.
 */
export function isColor(token: TransformedToken): boolean {
  return (token.$type ?? (token as { type?: string }).type) === "color";
}
