import React from "react";
import { clsx } from "clsx";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Prose.module.css";

export type ProseProps = React.ComponentPropsWithRef<"div">;

/**
 * A region of running text, set the way Cuboid sets a document: body text, headings by level, lists, quotes, links and inline code,
 * with the spacing between blocks. For the raw HTML that rich text produces (an editor, a rendered document) where each element
 * cannot be a Cuboid component; for a screen's own text use `Text` and `Heading`.
 *
 * It styles descendants by element, from the `prose` tokens, and spaces the blocks that are its children. A container inside it that
 * holds blocks of its own (a callout's content, a column) marks itself `data-prose-flow` and its children are spaced the same way.
 */
export function Prose({ className, ...props }: ProseProps) {
  return <div {...mergeProps({ "data-component": "Prose", className: clsx(classes.Prose, className) }, props)} />;
}
