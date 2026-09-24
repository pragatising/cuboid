import type { Transform, TransformedToken } from "style-dictionary/types";
import { isNumber } from "../filters/isNumber";

/**
 * Converts a float multiplier token (e.g. a line-height number) to a
 * pixel value, using a `fontSize` figure stashed on the token's
 * `org.cuboid.data` extension. Passes the value through unchanged if
 * that extension isn't present. Matches Primer's
 * transformers/floatToPixel.ts (`org.primer.data`, renamed to cuboid's
 * namespace).
 */
export function convertFloatToPixel(token: TransformedToken, unitless = false): unknown {
  const value = (token as { value?: unknown }).value;
  const fontSize = token.$extensions?.["org.cuboid.data"]?.fontSize;

  if (typeof value !== "number" || typeof fontSize !== "number") {
    return value;
  }

  const convertedValue = fontSize * value;
  if (convertedValue === 0) return 0;
  return unitless ? Math.round(convertedValue) : `${Math.round(convertedValue)}px`;
}

export const floatToPixel: Transform = {
  name: "float/pixel",
  type: "value",
  transitive: true,
  filter: isNumber,
  transform: (token: TransformedToken): unknown => convertFloatToPixel(token),
};

export const floatToPixelUnitless: Transform = {
  name: "float/pixelUnitless",
  type: "value",
  transitive: true,
  filter: isNumber,
  transform: (token: TransformedToken): unknown => convertFloatToPixel(token, true),
};
