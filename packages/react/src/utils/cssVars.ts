import type React from "react";

type VarTree = { [key: string]: string | VarTree };

const kebab = (key: string) => key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);

/**
 * Turns resolved token values into element-scoped CSS custom properties, for the state colours
 * (hover / pressed / disabled) a component's CSS needs and an inline style cannot express.
 *
 * The convention for every state-heavy component: `--<component>-<property>[-<state>]`.
 *
 *   cssVars("button", { bg: { rest: "#fff", hover: "#eee" } })
 *   // -> { "--button-bg-rest": "#fff", "--button-bg-hover": "#eee" }
 *
 * The values still come from `useTokens()`, so a mode change re-renders them. The variables are
 * private plumbing between a component and its own CSS module: they are scoped to the element, not
 * a global theming mechanism (ADR-04). Keys are kebab-cased; nesting joins with "-".
 */
export function cssVars(component: string, tree: VarTree): React.CSSProperties {
  const out: Record<string, string> = {};

  const walk = (node: VarTree, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string") out[`--${[component, ...path, key].map(kebab).join("-")}`] = value;
      else walk(value, [...path, key]);
    }
  };
  walk(tree, []);

  return out as React.CSSProperties;
}
