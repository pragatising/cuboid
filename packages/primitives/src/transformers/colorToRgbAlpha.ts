import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isColorWithAlpha } from "../filters/isColorWithAlpha.ts";
import { alpha } from "./utilities/alpha.ts";
import { getTokenValue } from "./utilities/getTokenValues.ts";
import { normalizeColorValue } from "./utilities/normalizeColorValue.ts";

/**
 * Style Dictionary value transform: replaces a color-with-alpha token's
 * value with an rgba() string using the token's `alpha` sibling key.
 * Matches Primer's transformers/colorToRgbAlpha.ts.
 */
export const colorToRgbAlpha: Transform = {
  name: "color/rgbAlpha",
  type: "value",
  transitive: true,
  filter: isColorWithAlpha,
  transform: (token: TransformedToken, config: PlatformConfig) => {
    const rawValue = getTokenValue(token) as Parameters<typeof normalizeColorValue>[0];
    const colorString = normalizeColorValue(rawValue);
    const alphaValue = (token as { alpha?: number | null }).alpha;

    if (alphaValue === null || alphaValue === undefined) return colorString;
    return alpha(colorString, alphaValue, token, config);
  },
};
