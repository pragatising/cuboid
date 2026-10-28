/**
 * The examples engine: composes examples of a component from its props alone. It has no React, no DOM and no knowledge of any
 * library; its only input is a component's description (the shape `components.json` has) and the host's fixtures. That is what
 * lets it be lifted out of this package.
 */

/** One prop, as `components.json` describes it. */
export type PropDoc = {
  name: string;
  required?: boolean;
  /** `enum`, `flag`, `slot`, `value`, `event`, `function`, `ref`, `open`, `state` (held by the app) or `other`. */
  kind: string;
  values?: (string | number)[];
  /** The default as source text (`"\"center\""`), when the types say one. */
  default?: string;
  /** A slot that must be one element, because the component puts props on it (it clones it): text would break it. */
  element?: boolean;
  /** What fills this slot, when the model says better than text (for an `element` slot: a button). */
  filler?: Node;
};

/** A part a compound component carries (`Header.Leading`), with what the standard and the code say about it. */
export type PartDoc = {
  /** How it is written in JSX: `ActionMenu.Item`. */
  tag: string;
  name: string;
  /** An item of something: its role must sit inside another (a `menuitem` in a `menu`). */
  item: boolean;
  /** Holds items: its role owns the item's role (a `menu` owns `menuitem`s). */
  container: boolean;
  /** Takes content between its tags. */
  content: boolean;
  /** Its required props, so an instance can be written. */
  required: PropDoc[];
};

export type ComponentDoc = { name: string; props: PropDoc[]; parts?: PartDoc[] };

/** A piece of JSX: `<Icon name="add" />`. Data, so the same thing is printed as code and rendered as an element. */
export type Node = {
  tag: string;
  props?: Record<string, Value>;
  children?: (Node | string)[];
};

/** What a prop can be set to. `true` is printed as a bare attribute (`disabled`). */
export type Value = string | number | boolean | Node | (Node | string)[];

/** What only the host knows: the words and the pictures to put in a component's slots. */
export type Fixtures = {
  /** The label of a component whose `children` is its text: a short one, and one long enough to show how it wraps. */
  labels: { short: string; long: string };
  /** What fills a slot, by prop name; `"*"` fills any slot with no filler of its own. */
  fillers: Record<string, Node>;
  /**
   * Groups of flags that make no sense on at the same time (`disabled`, `loading` and `inactive` all mean "cannot be used right
   * now"). An example turns on at most one of a group. The types cannot say this; the host does.
   */
  exclusive?: string[][];
};
