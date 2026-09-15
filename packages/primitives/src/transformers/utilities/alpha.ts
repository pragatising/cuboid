/**
 * Extracts/applies the alpha channel on a color value. Needed for the
 * grayAlpha scale and overlay.sheet in tokens/base/light.json, both
 * authored as rgba() — see colorToHex.ts's comment for the real coexisting
 * shapes this handles. Matches Primer's transformers/utilities/alpha.ts.
 *
 * Not yet implemented — stub only.
 */
export function alpha(_value: string): number {
  throw new Error("not implemented");
}
