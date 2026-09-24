import { z } from "zod";
import type { TokenType } from "./validTokenType";

/**
 * A Zod literal for one specific $type value — used by each per-type
 * schema (e.g. colorToken.ts does `$type: tokenType("color")`). Matches
 * Primer's schemas/tokenType.ts.
 */
export function tokenType($type: TokenType) {
  return z.literal($type);
}
