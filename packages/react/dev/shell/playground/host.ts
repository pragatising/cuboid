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
  attributes: { IconButton: { "aria-label": "Add" } },
};

/** `ActionMenu.Item` is the `Item` of `ActionMenu`. */
export function resolve(tag: string): React.ElementType | undefined {
  let found: unknown = library;
  for (const part of tag.split(".")) found = (found as Record<string, unknown> | undefined)?.[part];
  return found as React.ElementType | undefined;
}
