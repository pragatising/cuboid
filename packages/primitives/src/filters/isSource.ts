import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token is a "source" token — i.e. it should actually be
 * emitted to output, as opposed to a token only included for reference
 * resolution (Style Dictionary's `include` vs `source` distinction).
 * Primer applies this as the base filter on every real output file.
 * Matches Primer's filters/isSource.ts.
 */
export function isSource(token: TransformedToken): boolean {
  // The base layer is reference-only and never emitted. It is normally kept
  // out by living in `include`, but a consumer override of a base token
  // (src/build.ts `overrides`, appended to `source`) makes the merged token
  // count as source — so exclude the base namespace explicitly as well.
  return token.isSource === true && token.path[0] !== "base";
}
