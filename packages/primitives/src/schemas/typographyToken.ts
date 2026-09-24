import { z } from "zod";
import { referenceValue } from "./referenceValue";
import { dimensionValue } from "./dimensionValue";
import { baseToken } from "./baseToken";
import { fontWeightValue } from "./fontWeightValue";
import { tokenType } from "./tokenType";

/**
 * Full `typography` token schema — {fontFamily, fontSize, fontWeight,
 * lineHeight?}. Matches Primer's schemas/typographyToken.ts.
 */
export const typographyValue = z.object({
  fontSize: z.union([dimensionValue, referenceValue]),
  lineHeight: z.union([z.number(), referenceValue]).optional(),
  fontWeight: z.union([fontWeightValue, referenceValue]),
  fontFamily: z.union([z.string().min(1), referenceValue]),
});

export const typographyToken = baseToken.extend({
  $value: z.union([typographyValue, referenceValue]),
  $type: tokenType("typography"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
