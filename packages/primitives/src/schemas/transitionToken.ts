import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { durationToken } from "./durationToken.ts";
import { cubicBezierToken } from "./cubicBezierToken.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `transition` token schema — {duration, timingFunction, delay?}.
 * Matches Primer's schemas/transitionToken.ts.
 */
export const transitionToken = baseToken.extend({
  $value: z.union([
    z.object({
      duration: z.union([durationToken.shape.$value, referenceValue]),
      timingFunction: z.union([cubicBezierToken.shape.$value, referenceValue]),
      delay: z.union([durationToken.shape.$value, referenceValue]).optional(),
    }),
    referenceValue,
  ]),
  $type: tokenType("transition"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
