import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isDuration } from "../filters/isDuration.ts";
import { isAlreadyTransformed } from "./utilities/isAlreadyTransformed.ts";

interface DurationValue {
  value: number;
  unit: "ms" | "s";
}

/**
 * `{value, unit}` duration -> a CSS duration string, always in ms
 * (rounded to avoid floating-point noise, e.g. 0.0049s -> 4.9ms not
 * 4.8999...ms). Matches Primer's transformers/durationToCss.ts. Excludes
 * transformers/utilities/isAlreadyTransformed.ts.
 */
export const durationToCss: Transform = {
  name: "duration/css",
  type: "value",
  transitive: true,
  filter: isDuration,
  transform: (token: TransformedToken, _config: PlatformConfig, options: Config) => {
    const valueProp = options.usesDtcg ? "$value" : "value";
    const tokenValue = (token as unknown as Record<string, unknown>)[valueProp];

    if (isAlreadyTransformed(tokenValue)) return tokenValue;

    if (typeof tokenValue !== "object" || tokenValue === null || !("value" in tokenValue) || !("unit" in tokenValue)) {
      throw new Error(`duration token value must be an object with "value" and "unit" properties (W3C DTCG format). Invalid token: ${token.name} with value: ${JSON.stringify(tokenValue)}`);
    }

    const { value, unit } = tokenValue as DurationValue;

    if (unit !== "ms" && unit !== "s") {
      throw new Error(`duration token unit must be "ms" or "s", invalid token: ${token.name} with unit: ${unit}`);
    }

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`duration token value must be a finite, non-negative number, invalid token: ${token.name} with value: ${value}`);
    }

    if (unit === "s") {
      return `${parseFloat((value * 1000).toPrecision(12))}ms`;
    }

    return `${value}ms`;
  },
};
