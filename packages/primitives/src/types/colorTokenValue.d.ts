import type { ColorW3cValue } from "../schemas/colorW3cValue";

/**
 * The shape of a color token's $value: a hex string, a full W3C DTCG
 * color object (any color space), or a {path.to.token} reference string
 * (resolved by Style Dictionary before this type ever applies at
 * runtime). Matches schemas/colorToken.ts.
 */
export type ColorTokenValue = string | ColorW3cValue;
