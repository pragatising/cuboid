import type { Expr } from "./Expr";

/** A function the component is wrapped in where it is defined: `memo(Toggle)`, `forwardRef(Toggle)`. Outermost first. */
export type Wrapper = {
  /** As called: `memo`, `React.forwardRef`. */
  name: string;
  from?: string;
  /** Its arguments other than the component itself: `memo`'s comparison function. */
  arguments: Expr[];
};
