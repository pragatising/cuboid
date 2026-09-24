import { toHex } from "color2k";
import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isColor } from "../filters/isColor";
import { getTokenValue } from "./utilities/getTokenValues";
import { alpha } from "./utilities/alpha";
import { normalizeColorValue } from "./utilities/normalizeColorValue";

/**
 * Style Dictionary value transform: converts a resolved color token's
 * value to a hex string, applying the token's own `alpha` sibling key if
 * present. Matches Primer's transformers/colorToHex.ts.
 */
export const colorToHex: Transform = {
  name: "color/hex",
  type: "value",
  transitive: true,
  filter: isColor,
  transform: (token: TransformedToken, config: PlatformConfig) => {
    const rawValue = getTokenValue(token) as Parameters<typeof normalizeColorValue>[0];
    const colorString = normalizeColorValue(rawValue);
    const alphaValue = (token as { alpha?: number | null }).alpha;

    if (alphaValue === null || alphaValue === undefined || alphaValue === 1) {
      return toHex(colorString);
    }
    return toHex(alpha(colorString, alphaValue, token, config));
  },
};
