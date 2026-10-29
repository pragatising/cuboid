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
  /** A slot that gives the control its accessible name (it lands in a `label`): an example always has it, because one without is not usable. */
  names?: boolean;
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
  /** The part it must be written inside, when HTML says (an `li` goes in the part that renders the `ul`); absent for the component itself. */
  inside?: string;
  /** Other parts it is also written inside (a row is in the header and in the body). */
  alsoInside?: string[];
  /** The HTML element it renders. */
  element?: string;
  /** The row group its element belongs in (`thead` for a header cell): it is only written under a part that renders that group. */
  belongsIn?: string;
  /** The HTML element its content sits in, so a part that takes only elements is not given text. */
  holds?: string;
  /** There is one of it in its parent (a `thead`, or the one `tbody` an example needs), so it is not repeated. */
  once?: boolean;
  /** It goes around the component, not in it (a `Table.Root` shell around the `table`): what holds the component's own element, and cannot be held by it. */
  wraps?: boolean;
  /** False when nothing the component renders can hold it (a `div` wrapper inside a `table`): it is not part of a composition. */
  placeable: boolean;
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
  /**
   * Attributes every example of a component carries, by component name: the host knows what a component cannot say of itself, such as
   * the `aria-label` an icon-only button is given, which is its whole accessible name.
   */
  attributes?: Record<string, Record<string, string>>;
  /**
   * Components that are one control where the engine cannot read that (an icon button renders through a tooltip), or become one with a
   * prop (a pill given `as="button"`), by name: the props that make them so, or null when they are one as they are. Offered where a slot
   * must be a single control (a menu's trigger).
   */
  controls?: Record<string, Record<string, string> | null>;
  /** Parts drawn with nothing in them, by tag: a divider takes children as any element does, and nobody puts text in one. */
  empty?: string[];
};
