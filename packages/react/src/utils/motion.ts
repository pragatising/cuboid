import type { Tokens } from "../mode";

type Transition = Tokens["motion"]["transition"][keyof Tokens["motion"]["transition"]];

/**
 * A CSS `transition` value from a motion transition token (`tokens.motion.transition.hover`, …)
 * for the given properties: `background-color 100ms cubic-bezier(0.25, 0.1, 0.25, 1), …`.
 */
export function transitionCss(token: Transition, properties: string[]): string {
  const timing = `${token.duration.value}${token.duration.unit} cubic-bezier(${token.timingFunction.join(", ")})`;
  return properties.map((property) => `${property} ${timing}`).join(", ");
}
