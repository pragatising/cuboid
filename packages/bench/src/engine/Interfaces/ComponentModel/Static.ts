import type { Expr } from "./Expr";

/** A property attached to the component itself, which is how a compound component carries its parts: `Menu.Item`. */
export type Static = {
  name: string;
  value: Expr;
  /** Where the component it is written, when it is a component in this project: `src/…/ListItem.tsx#ListItem`. */
  declared?: string;
  /** How it was attached: `Object.assign`, or an assignment (`Menu.Item = Item`). */
  how: string;
};
