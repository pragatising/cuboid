import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { durationValue } from "./durationValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `duration` token schema. Matches Primer's
 * schemas/durationToken.ts.
 */
export const durationToken = baseToken.extend({
  $value: z.union([durationValue, referenceValue]),
  $type: tokenType("duration"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
