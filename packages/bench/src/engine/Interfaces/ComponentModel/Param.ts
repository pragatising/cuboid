/** A parameter of the component function, as written: `{ defaultOn = false, ...rest }`, or `props`, or `allProps`. */
export type Param = {
  /** The binding as written. */
  pattern: string;
  /** Its type annotation as written, if it has one. */
  type?: string;
  /** The names an object pattern binds, in order. Empty when the parameter is a plain name. */
  bindings: {
    name: string;
    /** The property it is taken from, when that is not its name: `"aria-describedby": described` has key `aria-describedby`. */
    key?: string;
    /** The default as source text: `= false`. */
    default?: string;
    /** Set on `...rest`. */
    rest?: boolean;
  }[];
};
