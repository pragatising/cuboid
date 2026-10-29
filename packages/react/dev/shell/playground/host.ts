import type React from "react";
import * as library from "../../../src";
import type { Fixtures } from "../../engine/types";

/**
 * What the examples engine needs from the library it is documenting: the name an app imports it by, how to find a component from
 * its name, and the words and pictures to put in slots. This is the one file that knows Cuboid; the engine does not.
 */
export const importFrom = "@sragatiping/cuboid";

export const fixtures: Fixtures = {
  labels: { short: "Save changes", long: "Save all changes and continue to the next step" },
  fillers: {
    leadingVisual: { tag: "Icon", props: { name: "add" } },
    trailingVisual: { tag: "Icon", props: { name: "arrow_forward" } },
    // IconButton's whole content: it is an icon, not a label.
    icon: { tag: "Icon", props: { name: "add" } },
  },
  // An icon-only button is named by what the caller says it does, and nothing in its types says so: the library warns "pass `aria-label`".
  // A divider is a line between two groups: it takes children as any element does, and nobody puts text in one.
  empty: ["Header.Divider"],
  // The components that are one control, for where a slot must be one (a menu's trigger): a pill becomes one with `as`.
  controls: { Button: null, IconButton: null, Link: null, Pill: { as: "button" } },
  attributes: {
    IconButton: { "aria-label": "Add" },
    // An icon is its name: nothing in the types can say which of the hundreds to draw.
    Icon: { name: "add" },
    TileIcon: { name: "add" },
    EmptyState: { icon: "inbox" },
    // What a component needs and only an app can say: the keys of a shortcut, a tooltip's words, a block of code.
    KeybindingHint: { keys: "Mod+K" },
    // The words of a tooltip that names its trigger are the trigger's own (WCAG 2.5.3: the visible text is part of the name).
    Tooltip: { text: "Trigger" },
    CodeBlock: { code: "const total = items.length;" },
  },
};

/** `ActionMenu.Item` is the `Item` of `ActionMenu`. */
export function resolve(tag: string): React.ElementType | undefined {
  let found: unknown = library;
  for (const part of tag.split(".")) found = (found as Record<string, unknown> | undefined)?.[part];
  return found as React.ElementType | undefined;
}
