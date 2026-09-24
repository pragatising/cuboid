import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { tokenType } from "./tokenType.ts";
import { colorHexValue } from "./colorHexValue.ts";
import { colorW3cValue } from "./colorW3cValue.ts";

/**
 * Full `gradient` token schema — an array of {color, position} stops.
 * `$extensions['org.cuboid.gradient'].angle` carries the direction
 * (renamed from Primer's `org.primer.gradient`). Matches Primer's
 * schemas/gradientToken.ts.
 */
export const gradientToken = baseToken.extend({
  $value: z.union([
    z
      .array(
        z.object({
          color: z.union([colorHexValue, colorW3cValue, referenceValue]),
          position: z.number().min(0).max(1),
        }),
      )
      .min(2),
    referenceValue,
  ]),
  $type: tokenType("gradient"),
  $extensions: z
    .object({
      "org.cuboid.gradient": z
        .object({
          angle: z.number().int().min(0).max(360).optional(),
        })
        .optional(),
    })
    .catchall(z.unknown())
    .optional(),
});
