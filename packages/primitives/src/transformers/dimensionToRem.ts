import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isDimension } from "../filters/isDimension";
import { parseDimension } from "./utilities/parseDimension";

function getBasePxFontSize(options?: PlatformConfig): number {
  return (options && options.basePxFontSize) || 16;
}

/**
 * Style Dictionary value transform: converts a resolved dimension
 * token's value to a rem string, honoring an optional `basePxFontSize`
 * override. rem/em values pass through unchanged (em is relative to its
 * parent and cannot be converted). Matches Primer's
 * transformers/dimensionToRem.ts.
 */
export const dimensionToRem: Transform = {
  name: "dimension/rem",
  type: "value",
  transitive: true,
  filter: isDimension,
  transform: (token: TransformedToken, config: PlatformConfig, options: Config) => {
    const valueProp = options.usesDtcg ? "$value" : "value";
    const baseFont = getBasePxFontSize(config);

    try {
      const { value, unit } = parseDimension((token as unknown as Record<string, unknown>)[valueProp]);

      if (value === 0) return "0";
      if (unit === "rem") return `${value}rem`;
      if (unit === "em") return `${value}em`;
      return `${value / baseFont}rem`;
    } catch (error) {
      const details = error instanceof Error && error.message ? ` - ${error.message}` : error ? ` - ${String(error)}` : "";
      throw new Error(
        `Invalid dimension token: '${token.name}: ${JSON.stringify((token as unknown as Record<string, unknown>)[valueProp])}' is not valid and cannot be transformed to 'rem'${details}\n`,
      );
    }
  },
};
