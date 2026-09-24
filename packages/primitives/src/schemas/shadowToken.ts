import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { colorHexValue } from "./colorHexValue";
import { colorW3cValue } from "./colorW3cValue";
import { alphaValue } from "./alphaValue";
import { dimensionValue } from "./dimensionValue";
import { tokenType } from "./tokenType";

/**
 * A single shadow layer — matches Primer's schemas/shadowToken.ts
 * shadowValue shape. `inset`/`alpha` are practical additions, not in the
 * W3C spec proper.
 */
export const shadowValue = z.object({
  color: z.union([colorHexValue, colorW3cValue, referenceValue]),
  alpha: z.union([alphaValue, referenceValue]).optional(),
  offsetX: z.union([dimensionValue, referenceValue]),
  offsetY: z.union([dimensionValue, referenceValue]),
  blur: z.union([dimensionValue, referenceValue]),
  spread: z.union([dimensionValue, referenceValue]),
  inset: z.boolean().optional(),
});

/**
 * Full `shadow` token schema — one shadow layer, or an array of them for
 * layered shadows.
 */
export const shadowToken = baseToken.extend({
  $value: z.union([shadowValue, z.array(shadowValue), referenceValue]),
  $type: tokenType("shadow"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
