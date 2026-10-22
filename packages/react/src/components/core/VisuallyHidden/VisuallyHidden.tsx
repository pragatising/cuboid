import React from "react";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";

export type VisuallyHiddenProps<As extends React.ElementType = "span"> = PolymorphicProps<As, "span">;

/** What the clip pattern sets: out of sight and out of the layout, but still read by screen readers. */
const HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Text for screen readers only: visually hidden, still in the accessibility tree. Use it for what a sighted user gets from
 * context (a shortcut's key names, "opens in a new tab") and an assistive-technology user would otherwise miss.
 */
export function VisuallyHidden<As extends React.ElementType = "span">({ as, ...props }: VisuallyHiddenProps<As>) {
  const Component: React.ElementType = as ?? "span";
  return <Component {...mergeProps({ "data-component": "VisuallyHidden", style: HIDDEN }, props as object)} />;
}
