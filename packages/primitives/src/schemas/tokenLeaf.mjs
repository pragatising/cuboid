/**
 * Zod schema for a single token leaf — Phase 0 scaffolding.
 *
 * Status: inert. Nothing in the real build calls this yet. Validates
 * cuboid's *current* token shape (`{ "value": ... }`, pre-DTCG) so Phase 1
 * can port the 159 inline checks in build-theme.mjs to real schemas without
 * also changing the token format in the same step — those are deliberately
 * separate decisions. See docs/token-architecture-migration.md.
 */

import { z } from "zod";

/**
 * A resolved leaf: a plain value.
 * A reference leaf: "{some.token.path}", resolved by build-theme.mjs's
 * own resolveOnce() before this would ever run against real files.
 */
export const TokenLeafSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const TokenReferenceSchema = z.object({
  value: z.string().regex(/^\{[^}]+\}$/, "must be a {path.to.token} reference"),
});
