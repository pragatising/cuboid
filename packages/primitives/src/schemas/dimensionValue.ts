import { z } from "zod";

/**
 * W3C DTCG dimension value format — matches Primer's
 * schemas/dimensionValue.ts, plus "em" (not in the DTCG spec proper but
 * supported for practical use, per Primer's real
 * types/dimensionTokenValue.d.ts and parseDimension.ts).
 * @see https://www.designtokens.org/tr/drafts/format/#dimension
 */
export const dimensionValue = z.object({
  value: z.number(),
  unit: z.enum(["px", "rem", "em"]),
});
