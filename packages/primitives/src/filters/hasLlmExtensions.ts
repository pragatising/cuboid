import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token has an `org.cuboid.llm` extension — used by the
 * markdown LLM-guidelines doc generator (Group 17) to select which
 * tokens to include. Matches Primer's filters/hasLlmExtensions.ts
 * (renamed from `org.primer.llm`).
 */
export function hasLlmExtensions(token: TransformedToken): boolean {
  return token.$extensions !== undefined && token.$extensions !== null && typeof token.$extensions === "object" && "org.cuboid.llm" in token.$extensions;
}
