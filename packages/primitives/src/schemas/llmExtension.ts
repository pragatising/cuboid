import { z } from "zod";

/**
 * Schema for the `org.cuboid.llm` extension — agent-readable usage
 * guidance authored directly on a token, already real content in cuboid's
 * token files (e.g. functional/typography/typography.json5's `usage`/
 * `rules` fields). Matches Primer's schemas/llmExtension.ts (`org.primer.llm`).
 */
export const llmExtension = z
  .object({
    usage: z.array(z.string()).optional(),
    rules: z.string().optional(),
  })
  .optional();
