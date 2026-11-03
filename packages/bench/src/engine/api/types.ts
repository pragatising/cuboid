/** A part of a prop's type that is a set of values (named, like `FgColor`, or loose) and/or a shape that is typed (`#…`, a number). */
export type Member = {
  name: string;
  set?: string;
  values?: (string | number)[];
  free?: string[];
};

/** A prop as `components.json` has it, from the component's own types. */
export type PropInfo = {
  name: string;
  required?: boolean;
  type: string;
  kind: string;
  values?: (string | number)[];
  default?: string;
  description?: string;
  members?: Member[];
  /** The file that declares it, relative to the library's root. */
  source?: string;
  /** The type as the code writes it (`BorderColor | CssColor`), where `type` is what the checker prints (a flattened list of values). */
  written?: string;
  /** Written as a mapped type, so it has no declaration of its own (Box's `padding`, `gap`…). */
  mapped?: boolean;
};

/** A component as `components.json` has it: what it declares and what it takes from others, as the code says. */
export type ComponentJson = {
  props: PropInfo[];
  /** What the platform and other packages add (the element's attributes, CSS), counted: not listed. */
  native?: { dom: number; css: number };
  parts?: (ComponentJson & { name: string })[];
};
