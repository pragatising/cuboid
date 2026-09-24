import type { Transform, TransformedToken } from "style-dictionary/types";
import { isTypography } from "../filters/isTypography.ts";
import type { TypographyTokenValue } from "../types/typographyTokenValue";
import { checkRequiredTokenProperties } from "./utilities/checkRequiredTokenProperties.ts";
import { parseFontFamily } from "./fontFamilyToCss.ts";
import { parseFontWeight } from "./fontWeightToNumber.ts";
import { getTokenValue } from "./utilities/getTokenValues.ts";

/**
 * Composite typography value ({fontFamily, fontSize, fontWeight,
 * lineHeight?, fontStyle?}) -> a CSS `font` shorthand string. Matches
 * Primer's transformers/typographyToCss.ts.
 */
export const typographyToCss: Transform = {
  name: "typography/css",
  type: "value",
  transitive: true,
  filter: isTypography,
  transform: (token: TransformedToken) => {
    const value = getTokenValue(token) as TypographyTokenValue;
    checkRequiredTokenProperties(value as unknown as Record<string, unknown>, ["fontWeight", "fontSize", "fontFamily"]);

    return `${value.fontStyle || ""} ${parseFontWeight(getTokenValue(token, "fontWeight"))} ${value.fontSize}${
      value.lineHeight ? `/${value.lineHeight}` : ""
    } ${parseFontFamily(getTokenValue(token, "fontFamily"))}`
      .trim()
      .replace(/\s\s+/g, " ");
  },
};
