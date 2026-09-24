import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isDimension } from "../filters/isDimension.ts";
import { parseDimension } from "./utilities/parseDimension.ts";

function getBasePxFontSize(options?: PlatformConfig): number {
  return (options && options.basePxFontSize) || 16;
}

/**
 * Style Dictionary value transform: converts a resolved dimension
 * token's value to a bare px number (no unit suffix) for px/rem values;
 * em values pass through as a string since they can't be converted to a
 * unitless number. Matches Primer's transformers/dimensionToPixelUnitless.ts.
 */
export const dimensionToPixelUnitless: Transform = {
  name: "dimension/pixelUnitless",
  type: "value",
  transitive: true,
  filter: isDimension,
  transform: (token: TransformedToken, config: PlatformConfig, options: Config) => {
    const valueProp = options.usesDtcg ? "$value" : "value";
    const baseFont = getBasePxFontSize(config);

    try {
      const { value, unit } = parseDimension((token as unknown as Record<string, unknown>)[valueProp]);

      if (value === 0) return 0;
      if (unit === "rem") return value * baseFont;
      if (unit === "em") return `${value}em`;
      return value;
    } catch (error) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid dimension token: '${token.path.join(".")}: ${JSON.stringify((token as unknown as Record<string, unknown>)[valueProp])}' - ${originalMessage}\n`);
    }
  },
};
