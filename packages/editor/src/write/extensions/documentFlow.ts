import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

/** The editable element is a flow: Cuboid's `Prose` spaces its blocks, whatever they are, by the same rule as a column's or a callout's. */
export const DocumentFlow = Extension.create({
  name: "documentFlow",
  addProseMirrorPlugins: () => [new Plugin({ props: { attributes: { "data-prose-flow": "" } } })],
});
