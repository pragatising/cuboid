/**
 * A member of the type of the component's first parameter: what a caller can pass. These are what the type checker says, not
 * what the body reads. Members declared in the project are listed, and so are inherited ones the parameter names (`disabled` in
 * `{ disabled, ...rest }`); the rest of what a library type brings is counted in `ComponentModel.inheritedProps`.
 */
export type Prop = {
  name: string;
  /** The type, with names for unions of literals spelled out: `"primary" | "secondary"`, `boolean`, `ReactNode`. */
  type: string;
  required: boolean;
  /** Set when the type inherits it from a library (the DOM's `disabled`) and the component's parameter names it. */
  inherited?: boolean;
  /** From the JSDoc `@default`, or the default in the parameter list. */
  default?: string;
  doc?: string;
};
