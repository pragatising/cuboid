import React from "react";
import { OutlineTreeTitle } from "./OutlineTreeTitle";

export type OutlineTreeItemProps = Omit<React.ComponentPropsWithRef<"li">, "color" | "content">;

/**
 * One item of an outline: a list item whose first child is its title and whose second, when it has one, is the `OutlineTree` hung from it. Its
 * number is drawn for it, by its place in the tree. Plain text as the first child is the title (an `OutlineTree.Title` is added around it).
 */
export function OutlineTreeItem({ children, ...props }: OutlineTreeItemProps) {
  const [first, ...rest] = React.Children.toArray(children);
  const title = typeof first === "string" || typeof first === "number" ? <OutlineTreeTitle>{first}</OutlineTreeTitle> : first;
  return (
    <li data-component="OutlineTree.Item" {...props}>
      {title}
      {rest}
    </li>
  );
}
