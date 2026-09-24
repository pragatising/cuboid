/**
 * Float RGBA (each channel 0-1) -> hex color string. Inverse of
 * hexToRgbaFloat.ts. Matches Primer's
 * transformers/utilities/rgbaFloatToHex.ts.
 */
export function rgbaFloatToHex({ r, g, b, a }: { r: number; g: number; b: number; a?: number }, includeAlpha = true): string {
  if (r > 1 || r < 0 || g > 1 || g < 0 || b > 1 || b < 0) {
    throw new Error("Invalid RgbaFloat value. R, G and B values must be between 0 and 1.");
  }

  const values = [r, g, b, includeAlpha && a !== undefined && a < 1 ? a : undefined].filter(
    (v): v is number => v !== undefined,
  );

  return `#${values.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}
