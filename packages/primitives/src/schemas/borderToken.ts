import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { colorHexValue } from "./colorHexValue.ts";
import { colorW3cValue } from "./colorW3cValue.ts";
import { dimensionValue } from "./dimensionValue.ts";
import { tokenType } from "./tokenType.ts";

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
