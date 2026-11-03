import { defineBlock } from "../../core";
import { outlineTreeRead } from "./outlineTree.read";

/**
 * An outline: numbered items, each with items nested under it. Items are `outlineItem` nodes (see `write/outline`): a title and, when it has any,
 * the outline hung from it. The block is the list itself (`ol`, with its items as direct children), and Cuboid's `OutlineTree` rules draw the
 * numbers and lines from its shape.
 */
export const outlineTree = defineBlock(outlineTreeRead, {
  holds: "blocks",
  accepts: "outlineItem+",
  element: { tag: "ol", attributes: { "data-component": "OutlineTree" } },
  menu: { label: "Outline", group: "basic", keywords: ["tree", "numbered", "nested", "steps", "hierarchy"] },
});
