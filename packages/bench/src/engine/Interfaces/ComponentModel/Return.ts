import type { Child } from "./Child";
import type { Expr } from "./Expr";

/**
 * One `return` in the component. Most return the tree, but a return can also be `null`, `children`, or a call such as
 * `createPortal(…)`, so what it returns is a Child (an element, text, or an expression).
 */
export type Return = {
  /**
   * The tests of the `if`s it sits inside, as written (the negated test, `!(…)`, for an `else`). An earlier return's test is not repeated here: a return is reached only
   * when the ones before it did not happen, which the order says.
   */
  guards: Expr[];
  value: Child;
};
