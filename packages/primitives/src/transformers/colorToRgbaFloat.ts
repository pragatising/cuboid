import { toHex } from "color2k";
import type { Transform, TransformedToken } from "style-dictionary/types";
import { isColor } from "../filters/isColor.ts";
import { getTokenValue } from "./utilities/getTokenValues.ts";
import { rgbaFloatToHex } from "./utilities/rgbaFloatToHex.ts";
import { hexToRgbaFloat } from "./utilities/hexToRgbaFloat.ts";
import { isRgbaFloat } from "./utilities/isRgbaFloat.ts";
import { normalizeColorValue, isW3cColorValue } from "./utilities/normalizeColorValue.ts";

function toRgbaFloat(token: TransformedToken, alphaOverride?: number) {
  let tokenValue = getTokenValue(token);

  if (isW3cColorValue(tokenValue)) {
    tokenValue = normalizeColorValue(tokenValue);
  }

  if (isRgbaFloat(tokenValue)) {
    tokenValue = rgbaFloatToHex(tokenValue, false);
  }

  const hex = toHex(tokenValue as string);
  return hexToRgbaFloat(hex, alphaOverride);
}

/**
 * Style Dictionary value transform: converts a resolved color token's
 * value to float RGBA (each channel 0-1). Matches Primer's
 * transformers/colorToRgbaFloat.ts.
 */
export const colorToRgbaFloat: Transform = {
  name: "color/rgbaFloat",
  type: "value",
  transitive: true,
  filter: isColor,
  transform: (token: TransformedToken) => {
    const value = getTokenValue(token);
    if (isRgbaFloat(value) && !("alpha" in token)) return value;
    return toRgbaFloat(token, (token as { alpha?: number }).alpha);
  },
};
