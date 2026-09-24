/**
 * Asserts a token value has every property a given $type requires (e.g.
 * a shadow leaf needs color/offsetX/offsetY/blur/spread), throwing a
 * clear error naming the missing one. Matches Primer's
 * transformers/utilities/checkRequiredTokenProperties.ts — the generic
 * replacement for the old build's hand-written per-component checks.
 */
export function checkRequiredTokenProperties(tokenValue: Record<string, unknown>, requiredProperties: readonly string[]): void {
  for (const prop of requiredProperties) {
    if (!(prop in tokenValue)) {
      throw new Error(`Missing property: ${prop} on token with value ${JSON.stringify(tokenValue)}`);
    }
  }
}
