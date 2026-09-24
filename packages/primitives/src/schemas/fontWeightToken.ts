import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { fontWeightValue } from "./fontWeightValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `fontWeight` token schema. Matches Primer's
 * schemas/fontWeightToken.ts.
 */
export const fontWeightToken = baseToken.extend({
  $value: z.union([fontWeightValue, referenceValue]),
  $type: tokenType("fontWeight"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
