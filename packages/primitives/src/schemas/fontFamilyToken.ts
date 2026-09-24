import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `fontFamily` token schema — a string or an array of strings (per
 * the DTCG spec), or a reference. Matches Primer's
 * schemas/fontFamilyToken.ts.
 */
export const fontFamilyToken = baseToken.extend({
  $value: z.union([z.string(), z.array(z.string()), referenceValue]),
  $type: tokenType("fontFamily"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
