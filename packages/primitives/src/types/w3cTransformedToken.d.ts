import type { TransformedToken } from "style-dictionary/types";

/**
 * The 7 primitive and 6 composite W3C DTCG $type values (see
 * docs/knowledge/w3c-design-token.md), narrowing Style Dictionary's
 * generic TransformedToken.$type (a plain string) to cuboid's real type
 * vocabulary. Matches Primer's types/w3cTransformedToken.d.ts.
 */
export type W3cTokenType = "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "number";
export type W3cCompositeTokenType = "shadow" | "border" | "gradient" | "transition" | "strokeStyle" | "typography";

export interface W3cTransformedToken extends TransformedToken {
  $type?: W3cTokenType | W3cCompositeTokenType;
}
