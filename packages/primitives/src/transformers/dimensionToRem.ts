import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isDimension } from "../filters/isDimension.ts";
import { isAlreadyTransformed } from "./utilities/isAlreadyTransformed.ts";
import { parseDimension } from "./utilities/parseDimension.ts";

function getBasePxFontSize(options?: PlatformConfig): number {
  return (options && options.basePxFontSize) || 16;
}

/**
 * Style Dictionary value transform: converts a resolved dimension
 * token's value to a rem string, honoring an optional `basePxFontSize`
 * override. rem/em values pass through unchanged (em is relative to its
 * parent and cannot be converted). Matches Primer's
 * transformers/dimensionToRem.ts. A real CSS value that can't be
 * expressed as {value, unit} (percentages, viewport units — DTCG
 * dimension's unit enum is px|rem|em only) is not a dimension token at
 * all — use $type: "custom-string" instead (see
 * components/container/container.json5's `full`/`screen` for the real
 * fix, not a transformer-side workaround).
 *
 * Idempotent: a value that is already a CSS string (because an earlier
 * transitive pass over the aliased token it resolved from produced one)
 * passes through untouched. See
 * transformers/utilities/isAlreadyTransformed.ts for why this is
 * required and why neither a base-token filter nor dropping
 * `transitive` is the right fix.
 */
export const dimensionToRem: Transform = {
  name: "dimension/rem",
  type: "value",
  transitive: true,
  filter: isDimension,
  transform: (token: TransformedToken, config: PlatformConfig, options: Config) => {
    const valueProp = options.usesDtcg ? "$value" : "value";
    const baseFont = getBasePxFontSize(config);

    const rawValue = (token as unknown as Record<string, unknown>)[valueProp];

    // Already a CSS string from an earlier transitive pass — return as-is.
    // See utilities/isAlreadyTransformed.ts for the full mechanism.
    if (isAlreadyTransformed(rawValue)) return rawValue;

    try {
      const { value, unit } = parseDimension(rawValue);

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
