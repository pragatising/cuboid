import type { TransformedToken } from "style-dictionary/types";

/**
 * Flattens a token list to one-level keys (dot-path name -> resolved
 * $value, or the full token object if `returnObject` is true). Matches
 * Primer's formats/utilities/jsonToFlat.ts.
 */
export function jsonToFlat(tokens: TransformedToken[], returnObject = false): Record<string, unknown> {
  return Object.fromEntries(tokens.map((token) => [token.name, returnObject ? token : token.$value]));
}
