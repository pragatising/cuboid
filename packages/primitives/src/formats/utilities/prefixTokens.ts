import type { PlatformConfig, TransformedTokens } from "style-dictionary/types";

/**
 * Wraps a token tree in one extra top-level key if the platform declares
 * a `prefix`. Matches Primer's formats/utilities/prefixTokens.ts.
 */
export function prefixTokens(tokens: TransformedTokens, platform: PlatformConfig = {}): TransformedTokens {
  const { prefix } = platform;
  if (typeof prefix === "string") {
    return { [prefix]: tokens } as unknown as TransformedTokens;
  }
  return tokens;
}
