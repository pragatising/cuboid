import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { colorHexValue } from "./colorHexValue";
import { colorW3cValue } from "./colorW3cValue";
import { dimensionValue } from "./dimensionValue";
import { tokenType } from "./tokenType";

/**
 * Full `border` token schema — {color, width, style}. Matches Primer's
 * schemas/borderToken.ts.
 */
export const borderValue = z.object({
  color: z.union([colorHexValue, colorW3cValue, referenceValue]),
  style: z.enum(["solid", "dashed", "dotted", "double", "groove", "ridge", "outset", "inset"]),
  width: z.union([dimensionValue, referenceValue]),
});

export const borderToken = baseToken.extend({
  $value: z.union([borderValue, referenceValue]),
  $type: tokenType("border"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
