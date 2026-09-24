import type { RgbaFloat } from "./isRgbaFloat";

/**
 * Hex color string (3/4/6/8-digit) -> float RGBA (each channel 0-1).
 * Matches Primer's transformers/utilities/hexToRgbaFloat.ts.
 */
export function hexToRgbaFloat(hex: string, alpha?: number): RgbaFloat {
  const pattern = hex.length > 5 ? /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i : /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;

  const result = pattern.exec(hex);
  if (result === null) {
    throw new Error('Invalid hex value in "hexToRgbaFloat". Please provide a valid hex3, hex4, hex6 or hex8 value.');
  }

  let [, r, g, b, a] = result;
  if (hex.length < 6) {
    r = r + r;
    g = g + g;
    b = b + b;
    if (a) a = a + a;
  }

  return {
    r: parseInt(r, 16) / 255,
    g: parseInt(g, 16) / 255,
    b: parseInt(b, 16) / 255,
    a: alpha !== undefined ? alpha : a ? parseInt(a, 16) / 255 : 1,
  };
}
