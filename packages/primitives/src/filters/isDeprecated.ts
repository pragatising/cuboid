import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token carries a real `$deprecated` value (either `true`, or
 * a string explaining the replacement). Matches Primer's
 * filters/isDeprecated.ts. No `$deprecated` field is authored in
 * cuboid's real token files yet — this is real infrastructure for
 * whenever a token deprecation workflow starts.
 */
export function isDeprecated(token: TransformedToken): boolean {
  const deprecated = (token.original as { $deprecated?: unknown }).$deprecated ?? token.$deprecated;
  return deprecated === true || typeof deprecated === "string";
}
