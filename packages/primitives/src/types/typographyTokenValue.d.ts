/**
 * W3C DTCG typography composite token value.
 * @see https://www.designtokens.org/tr/drafts/format/#typography
 * Matches Primer's types/typographyTokenValue.d.ts.
 */
export interface TypographyTokenValue {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  fontStyle?: string;
  letterSpacing?: number;
}
