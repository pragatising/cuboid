import type { DimensionTokenValue } from "./dimensionTokenValue";
import type { ColorW3cValue } from "../schemas/colorW3cValue";

/**
 * W3C DTCG border composite token value.
 * @see https://www.designtokens.org/tr/drafts/format/#border
 * Matches Primer's types/borderTokenValue.d.ts.
 */
export type StrokeStyleString = "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "outset" | "inset";

export interface BorderTokenValue {
  color: string | ColorW3cValue;
  width: string | DimensionTokenValue;
  style: StrokeStyleString;
}
