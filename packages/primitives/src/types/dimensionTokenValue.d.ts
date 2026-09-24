/**
 * W3C DTCG dimension value: a structured object, or a {path} reference
 * (resolved by Style Dictionary before this type applies). `em` is not
 * in the DTCG spec proper but is supported for practical use, matching
 * Primer's real types/dimensionTokenValue.d.ts.
 * @see https://www.designtokens.org/tr/drafts/format/#dimension
 */
export interface DimensionTokenValue {
  value: number;
  unit: "px" | "rem" | "em";
}
