import { toHex } from "color2k";
import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isShadow } from "../filters/isShadow.ts";
import { alpha } from "./utilities/alpha.ts";
import { checkRequiredTokenProperties } from "./utilities/checkRequiredTokenProperties.ts";
import type { ShadowTokenValue } from "../types/shadowTokenValue";
import type { DimensionTokenValue } from "../types/dimensionTokenValue";
import { getTokenValue } from "./utilities/getTokenValues.ts";
import { normalizeColorValue } from "./utilities/normalizeColorValue.ts";

function dimensionToCss(dim: DimensionTokenValue): string {
  if (dim.value === 0) return "0";
  return `${dim.value}${dim.unit}`;
}

/**
 * DTCG structured shadow object(s) -> one CSS box-shadow string, joining
 * multiple layers with commas. Matches Primer's transformers/shadowToCss.ts.
 * This is the one real reshaping step in the pipeline (DESIGN.md §4) —
 * shadows are stored as structured {color, offsetX, offsetY, blur,
 * spread} data in the source, joined into a CSS string only here.
 */
export const shadowToCss: Transform = {
  name: "shadow/css",
  type: "value",
  transitive: true,
  filter: isShadow,
  transform: (token: TransformedToken, config: PlatformConfig) => {
    const value = getTokenValue(token) as ShadowTokenValue | ShadowTokenValue[];
    const valueProp = token.$value ? "$value" : "value";
    const shadowValues = Array.isArray(value) ? value : [value];

    return shadowValues
      .map((shadow) => {
        if (typeof shadow === "string") return shadow;

        checkRequiredTokenProperties(shadow as unknown as Record<string, unknown>, ["color", "offsetX", "offsetY", "blur", "spread"]);

        const colorString = normalizeColorValue(getTokenValue({ ...token, [valueProp]: shadow } as TransformedToken, "color") as Parameters<typeof normalizeColorValue>[0]);
        const colorHex = shadow.alpha !== undefined ? toHex(alpha(colorString, shadow.alpha, token, config)) : toHex(colorString);

        return `${shadow.inset === true ? "inset " : ""}${dimensionToCss(shadow.offsetX)} ${dimensionToCss(shadow.offsetY)} ${dimensionToCss(shadow.blur)} ${dimensionToCss(shadow.spread)} ${colorHex}`;
      })
      .join(", ");
  },
};
