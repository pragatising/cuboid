import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `number` token schema — plain JSON number or reference. Matches
 * Primer's schemas/numberToken.ts.
 */
export const numberToken = baseToken.extend({
  $value: z.union([z.number(), referenceValue]),
  $type: tokenType("number"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
