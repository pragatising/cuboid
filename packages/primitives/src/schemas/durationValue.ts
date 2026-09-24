import { z } from "zod";

/**
 * W3C DTCG duration value format. Matches Primer's
 * schemas/durationValue.ts.
 * @see https://www.designtokens.org/tr/drafts/format/#duration
 */
export const durationValue = z.object({
  value: z.number(),
  unit: z.enum(["ms", "s"]),
});
