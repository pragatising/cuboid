import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { durationValue } from "./durationValue";
import { tokenType } from "./tokenType";

/**
 * Full `duration` token schema. Matches Primer's
 * schemas/durationToken.ts.
 */
export const durationToken = baseToken.extend({
  $value: z.union([durationValue, referenceValue]),
  $type: tokenType("duration"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
