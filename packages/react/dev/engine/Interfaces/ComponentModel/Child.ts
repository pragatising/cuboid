import type { Expr } from "./Expr";
import type { TreeElement } from "./TreeElement";

/** What can sit between an element's tags, as JSX allows it. */
export type Child =
  | {
      kind: "element";
      element: TreeElement;
    }
  | {
      kind: "text";
      text: string;
    }
  /** Anything in braces: `{children}`, `{count}`, `{on && <span/>}`, `{items.map(…)}`. It says only what it reads. */
  | {
      kind: "expression";
      expr: Expr;
    };
