import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { tokenType } from "./tokenType";

/**
 * Full `cubicBezier` token schema — a 4-number array or reference.
 * Matches Primer's schemas/cubicBezierToken.ts.
 */
export const cubicBezierToken = baseToken.extend({
  $value: z.union([z.array(z.number()).length(4), referenceValue]),
  $type: tokenType("cubicBezier"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
