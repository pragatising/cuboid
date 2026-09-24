import type { Transform, TransformedToken } from "style-dictionary/types";
import { isTransition } from "../filters/isTransition";
import { cubicBezierArrayToCss } from "./cubicBezierToCss";
import { checkRequiredTokenProperties } from "./utilities/checkRequiredTokenProperties";
import { getTokenValue } from "./utilities/getTokenValues";

interface TransitionValue {
  duration: string;
  timingFunction: string | number[];
  delay?: string;
}

/**
 * Composite transition value ({duration, timingFunction, delay?}) -> one
 * CSS transition shorthand string. Matches Primer's
 * transformers/transitionToCss.ts.
 */
export const transitionToCss: Transform = {
  name: "transition/css",
  type: "value",
  transitive: true,
  filter: isTransition,
  transform: (token: TransformedToken) => {
    const value = getTokenValue(token);

    if (typeof value === "string") {
      return value;
    }

    checkRequiredTokenProperties(value as Record<string, unknown>, ["duration", "timingFunction"]);
    const transitionValue = value as TransitionValue;

    const timing = typeof transitionValue.timingFunction === "string" ? transitionValue.timingFunction : cubicBezierArrayToCss(transitionValue.timingFunction, token.path);

    return `${transitionValue.duration} ${timing} ${transitionValue.delay ?? ""}`.trim();
  },
};
