import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isCubicBezier } from "../filters/isCubicBezier.ts";
import { isAlreadyTransformed } from "./utilities/isAlreadyTransformed.ts";

/**
 * `[a,b,c,d]` -> `cubic-bezier(a,b,c,d)` CSS string. Matches Primer's
 * transformers/cubicBezierToCss.ts.
 *
 * Idempotent — see transformers/utilities/isAlreadyTransformed.ts.
 */
export function cubicBezierArrayToCss(value: number[], path: string[]): string {
  if (value.length !== 4 || value.some((item) => typeof item !== "number")) {
    throw new Error(`Invalid cubicBezier token ${path.join(".")}, must be an array with 4 numbers, but got this instead: ${JSON.stringify(value)}`);
  }
  return `cubic-bezier(${value.join(",")})`;
}

export const cubicBezierToCss: Transform = {
  name: "cubicBezier/css",
  type: "value",
  transitive: true,
  filter: isCubicBezier,
  transform: (token: TransformedToken, _config: PlatformConfig) => {
    const value = token.$value ?? (token as { value?: unknown }).value;
    if (isAlreadyTransformed(value)) return value;
    return cubicBezierArrayToCss(value as number[], token.path);
  },
};
