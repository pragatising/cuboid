import { z } from "zod";
import { baseToken } from "./baseToken";
import { referenceValue } from "./referenceValue";
import { tokenType } from "./tokenType";

/**
 * `custom-string` — Primer's extension for a raw CSS value that has no
 * reference, or embeds a reference inside a larger string (not a
 * whole-value {path} reference, which referenceValue.ts already covers
 * on every other type). Real, confirmed usage in cuboid's own token
 * files: `functional/size/layout.json5`'s `sectionLabelWidth`
 * ("clamp(6.5rem, 25%, 10rem)") and `functional/size/border.json5`'s
 * `boxShadow.*` ("inset 0 0 0 {borderWidth.thin}"). Matches Primer's
 * schemas/stringToken.ts.
 */
export const stringToken = baseToken.extend({
  $value: z.union([z.string(), referenceValue]),
  $type: tokenType("custom-string"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
