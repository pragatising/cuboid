import type { Expr } from "./Expr";
import type { Reference } from "./Reference";

/**
 * Anything else in the component's body before it returns: a function (`function handleClick() { … }`), a value
 * (`const label = disabled ? "x" : y`, `const { a, b } = props`), or a statement that binds nothing (`console.log(x)`). Hooks are
 * not here (see HookCall), and neither is an `if` that returns (see Return). In source order.
 */
export type Local = {
  /** What it binds: one for a function or a const, several for a destructuring, none for a bare statement. */
  names: string[];
  /** The syntax it is written in: a function declaration or a function held in a const, any other declaration, or a statement. */
  kind: "function" | "value" | "statement";
  /** The whole thing as written. */
  source: string;
  reads: Reference[];
  /** The calls it makes, in order: `setOn(!on)`, `onChange?.(!on)`. */
  calls: {
    callee: Expr;
    arguments: Expr[];
  }[];
};
