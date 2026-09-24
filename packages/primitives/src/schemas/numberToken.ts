import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { tokenType } from "./tokenType";

/**
 * Full `number` token schema — plain JSON number or reference. Matches
 * Primer's schemas/numberToken.ts.
 */
export const numberToken = baseToken.extend({
  $value: z.union([z.number(), referenceValue]),
  $type: tokenType("number"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
