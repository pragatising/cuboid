import { z } from "zod";
import { referenceValue } from "./referenceValue.ts";
import { dimensionValue } from "./dimensionValue.ts";
import { baseToken } from "./baseToken.ts";
import { fontWeightValue } from "./fontWeightValue.ts";
import { tokenType } from "./tokenType.ts";

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
