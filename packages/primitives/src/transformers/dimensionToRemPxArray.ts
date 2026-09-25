import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isDimension } from "../filters/isDimension.ts";
import { isAlreadyTransformed } from "./utilities/isAlreadyTransformed.ts";
import { parseDimension } from "./utilities/parseDimension.ts";

type SizePx = "0" | `${number}px`;
type SizeRem = "0" | `${number}rem`;
type SizeEm = "0" | `${number}em`;

function getBasePxFontSize(options?: PlatformConfig): number {
  return (options && options.basePxFontSize) || 16;
}

/**
 * Style Dictionary value transform: converts a resolved dimension
 * token's value to a [rem, px] pair (or [em, em] for em values, which
 * can't be split into two units). Matches Primer's
 * transformers/dimensionToRemPxArray.ts. Idempotent — see
 * transformers/utilities/isAlreadyTransformed.ts.
 */
export const dimensionToRemPxArray: Transform = {
  name: "dimension/remPxArray",
  type: "value",
  transitive: true,
  filter: isDimension,
  transform: (token: TransformedToken, config: PlatformConfig, options: Config): [SizeRem, SizePx] | [SizeEm, SizeEm] | string => {
    const valueProp = options.usesDtcg ? "$value" : "value";
    const baseFont = getBasePxFontSize(config);

    const rawValue = (token as unknown as Record<string, unknown>)[valueProp];
    if (isAlreadyTransformed(rawValue)) return rawValue;

    try {
      const { value, unit } = parseDimension(rawValue);

      if (value === 0) return ["0", "0"];
      if (unit === "em") return [`${value}em`, `${value}em`];
      if (unit === "rem") return [`${value}rem`, `${value * baseFont}px`];
      return [`${value / baseFont}rem`, `${value}px`];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Invalid dimension token: '${token.name}: ${JSON.stringify((token as unknown as Record<string, unknown>)[valueProp])}' is not valid and cannot be transformed to 'rem' - ${errorMessage}\n`,
      );
    }
  },
};
