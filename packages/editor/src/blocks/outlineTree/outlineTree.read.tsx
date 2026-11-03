import { OutlineTree } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/** The outline: its items (`outlineItem`: a title, and the tree hung from it) are drawn by the reader, and the list and its lines by Cuboid's `OutlineTree`. */
export const outlineTreeRead = defineReadBlock({
  name: "outlineTree",
  attrs: {},
  Read: ({ children }) => <OutlineTree>{children}</OutlineTree>,
});
