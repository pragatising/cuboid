import type { HookCall } from "./HookCall";
import type { Local } from "./Local";
import type { Param } from "./Param";
import type { Prop } from "./Prop";
import type { Return } from "./Return";
import type { Static } from "./Static";
import type { Wrapper } from "./Wrapper";

/**
 * What is written in a React component, and nothing concluded from it: its parameters and their type, the hooks it calls and
 * the other things its body declares (each in source order), what it returns, and what it is wrapped in and carries. State,
 * effects, refs, callbacks, handlers, variants, slots and parts are not here: each is recognised from these records, later.
 */
export type ComponentModel = {
  name: string;
  /** Where it is written, so another component's reference to it can be followed: `src/…/ButtonBase.tsx#ButtonBase`. */
  declared: string;
  /** `memo(…)`, `forwardRef(…)` around it, outermost first. Empty when it is a plain function. */
  wrappers: Wrapper[];
  /** The parameters of the function, as written. */
  params: Param[];
  /** What the type of the first parameter lets a caller pass (declared in the project). */
  props: Prop[];
  /** How many more members that type inherits from a library, such as the DOM's attributes. Not listed. */
  inheritedProps: number;
  hooks: HookCall[];
  locals: Local[];
  /** Every `return`, in source order. */
  returns: Return[];
  /** What is attached to it: its parts, if it has any. */
  statics: Static[];
};
