import type { TransformedToken } from "style-dictionary/types";
import { isColor } from "./isColor.ts";

/**
 * True if a token is a color AND carries a real numeric `alpha` sibling
 * key. Matches Primer's filters/isColorWithAlpha.ts.
 */
export function isColorWithAlpha(token: TransformedToken): boolean {
  return isColor(token) && (token as { alpha?: unknown }).alpha !== undefined && typeof (token as { alpha?: unknown }).alpha === "number";
}
