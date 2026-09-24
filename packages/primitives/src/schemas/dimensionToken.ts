import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { dimensionValue } from "./dimensionValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `dimension` token schema. $extensions left loosely typed pending
 * a real org.cuboid.figma shape decision (see baseToken.ts/colorToken.ts).
 */
export const dimensionToken = baseToken.extend({
  $value: z.union([dimensionValue, referenceValue]),
  $type: tokenType("dimension"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
