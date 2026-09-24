import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { colorHexValue } from "./colorHexValue.ts";
import { colorW3cValue } from "./colorW3cValue.ts";
import { referenceValue } from "./referenceValue.ts";
import { alphaValue } from "./alphaValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * Full `color` token schema. $value is a hex string, a W3C color object,
 * or a {path} reference; `alpha` is a real sibling key on the token (not
 * inside $value) per cuboid's actual authored shape. $extensions is left
 * loosely typed pending a real org.cuboid.figma/org.cuboid.overrides
 * shape decision (see baseToken.ts) — Primer's equivalent hardcodes its
 * own Figma collection/scope/mode-override enums, not yet appropriate to
 * copy verbatim for cuboid's undecided naming.
 */
export const colorToken = baseToken.extend({
  $value: z.union([colorHexValue, colorW3cValue, referenceValue]),
  $type: tokenType("color"),
  alpha: alphaValue.optional().nullable(),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
