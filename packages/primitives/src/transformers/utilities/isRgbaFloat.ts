/**
 * Float-based RGBA color: each channel 0-1, not 0-255. Matches Primer's
 * transformers/utilities/isRgbaFloat.ts.
 */
export interface RgbaFloat {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export function isRgbaFloat(value: unknown): value is RgbaFloat {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.r === "number" &&
    typeof v.g === "number" &&
    typeof v.b === "number" &&
    v.r >= 0 &&
    v.r <= 1 &&
    v.g >= 0 &&
    v.g <= 1 &&
    v.b >= 0 &&
    v.b <= 1
  );
}
