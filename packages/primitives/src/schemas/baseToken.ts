import { z } from "zod";

/**
 * Shared shape every per-type token schema extends. Matches Primer's
 * schemas/baseToken.ts. `$extensions` is deliberately NOT here — Primer's
 * own per-type schemas each declare their own `$extensions` shape (a
 * numberToken's org.primer.figma.scopes differs from a colorToken's), so
 * cuboid's per-type schemas do the same rather than inheriting one generic
 * shape. Cuboid doesn't yet have a documented org.cuboid.figma/org.cuboid.llm
 * schema (deferred — see docs/backlog/token-pipeline-implementation-strategy.md),
 * so each type schema this pass validates $extensions loosely
 * (z.record(...).optional()) rather than guessing at real constraints.
 */
export const baseToken = z.object({
  $description: z.string().optional(),
});
