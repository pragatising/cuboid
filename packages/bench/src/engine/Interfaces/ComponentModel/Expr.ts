import type { Reference } from "./Reference";
import type { TreeElement } from "./TreeElement";

/**
 * A piece of code in the component (an attribute's value, a hook's argument, anything in braces), the names it uses, and the JSX
 * elements written inside it (`on && <span>On</span>`, `leadingVisual={<Icon />}`): JSX can sit in any expression, not only as
 * a direct child. A function written inline (`onClick={() => setOn(true)}`) stays in `source`; it is not a Local.
 */
export type Expr = {
  source: string;
  reads: Reference[];
  /** The outermost elements written inside it, in order. Each holds its own nested ones. */
  elements: TreeElement[];
  /**
   * The properties of every object literal written in it (`mergeProps(a, { "aria-disabled": busy })`), by key, with the names
   * each value uses. A props object built in code is as much a place where an attribute is set as a JSX attribute is.
   */
  properties: {
    key: string;
    reads: Reference[];
    /** The names read by the tests it sits under, so `...(busy ? { "aria-disabled": true } : {})` says `busy` decides it. */
    guards: Reference[];
  }[];
  /**
   * Every conditional written in it: `test ? a : b`, `test && a`, `test || b`. What each test reads, and what each branch reads, so
   * `{showEmpty ? empty : null}` says `empty` is shown only when `showEmpty` is.
   */
  branches: {
    test: Reference[];
    consequent: Reference[];
    alternate: Reference[];
  }[];
};
