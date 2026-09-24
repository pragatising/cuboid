import { z } from "zod";
import { baseToken } from "./baseToken.ts";
import { referenceValue } from "./referenceValue.ts";
import { tokenType } from "./tokenType.ts";

/**
 * `custom-viewportRange` — Primer's extension for a CSS custom-media
 * viewport range (e.g. `"(min-width: 768px)"`). No confirmed use in
 * cuboid's real token files today; built as real infrastructure anyway
 * (per standing instruction: "deferred" never means "not built"), ready
 * for cssCustomMedia.ts (Group 17) if a viewport-range token is
 * authored. Matches Primer's schemas/viewportRangeToken.ts.
 */
export const viewportRangeToken = baseToken.extend({
  $value: z.union([z.string(), referenceValue]),
  $type: tokenType("custom-viewportRange"),
  $extensions: z.record(z.string(), z.unknown()).optional(),
});
