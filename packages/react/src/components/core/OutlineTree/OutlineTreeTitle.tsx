import React from "react";

export type OutlineTreeTitleProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "content">;

/** An item's title: the first child of an `OutlineTree.Item`, set after the item's number. The tree's level decides its type: bold at the root, body text below. */
export function OutlineTreeTitle(props: OutlineTreeTitleProps) {
  return <div data-component="OutlineTree.Title" {...props} />;
}
