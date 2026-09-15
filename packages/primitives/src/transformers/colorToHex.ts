/**
 * Normalizes a color $value to one consistent shape for downstream
 * consumers. Real, not hypothetical: tokens/base/light.json authors colors
 * in TWO shapes today — plain hex ("#3A3A39") and rgba() for alpha values
 * (grayAlpha scale, overlay.sheet — "rgba(58,58,57,0.08)"). This is what
 * lets a generic emitter treat every "color" $type token the same way
 * regardless of which shape it was authored in, instead of the CSS/JS
 * output silently mixing both forms. Matches Primer's transformers/
 * colorToHex.ts + colorToRgbaFloat.ts pairing.
 *
 * Not yet implemented — stub only.
 */
export function colorToHex(_value: string): string {
  throw new Error("not implemented");
}
