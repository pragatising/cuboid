import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token is a "source" token — i.e. it should actually be
 * emitted to output, as opposed to a token only included for reference
 * resolution (Style Dictionary's `include` vs `source` distinction).
 * Primer applies this as the base filter on every real output file.
 * Matches Primer's filters/isSource.ts.
 */
export function isSource(token: TransformedToken): boolean {
  return token.isSource === true;
}
