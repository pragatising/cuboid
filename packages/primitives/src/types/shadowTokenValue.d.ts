import type { DimensionTokenValue } from "./dimensionTokenValue";
import type { ColorW3cValue } from "../schemas/colorW3cValue";

/**
 * W3C DTCG shadow composite token value.
 * @see https://www.designtokens.org/tr/drafts/format/#shadow
 * Matches Primer's types/shadowTokenValue.d.ts. `inset`/`alpha` are
 * practical additions, not in the W3C spec proper.
 */
export interface ShadowTokenValue {
  color: string | ColorW3cValue;
  offsetX: DimensionTokenValue;
  offsetY: DimensionTokenValue;
  blur: DimensionTokenValue;
  spread: DimensionTokenValue;
  inset?: boolean;
  alpha?: number;
}
