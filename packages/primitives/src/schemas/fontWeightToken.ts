import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { fontWeightValue } from "./fontWeightValue";
import { tokenType } from "./tokenType";

/**
 * Full `fontWeight` token schema. Matches Primer's
 * schemas/fontWeightToken.ts.
 */
export const fontWeightToken = baseToken.extend({
  $value: z.union([fontWeightValue, referenceValue]),
  $type: tokenType("fontWeight"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
