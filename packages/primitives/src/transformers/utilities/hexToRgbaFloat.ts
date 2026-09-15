/**
 * Hex color string -> {r, g, b, a} float components (0-1 range). The
 * inverse of rgbaFloatToHex — needed because cuboid's real color tokens
 * mix hex and rgba() authoring (see colorToHex.ts's comment; confirmed in
 * tokens/base/light.json's grayAlpha scale and overlay.sheet), so
 * converting everything through one common float representation is what
 * lets colorToHex normalize both shapes with one function instead of two
 * separate code paths. Matches Primer's transformers/utilities/
 * hexToRgbaFloat.ts.
 *
 * Not yet implemented — stub only.
 */
export function hexToRgbaFloat(_hex: string): { r: number; g: number; b: number; a: number } {
  throw new Error("not implemented");
}
