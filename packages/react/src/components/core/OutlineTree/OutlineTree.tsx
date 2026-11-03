import React from "react";
import { OutlineTreeItem } from "./OutlineTreeItem";
import { OutlineTreeTitle } from "./OutlineTreeTitle";
// The rules are keyed on the parts' `data-component`, not on a class, so an editor's own DOM is drawn by them too.
import "./OutlineTree.module.css";

/** An item as data: its title, and the items hung from it. */
export type OutlineTreeItemData = {
  title: React.ReactNode;
  children?: OutlineTreeItemData[];
};

export type OutlineTreeProps = Omit<React.ComponentPropsWithRef<"ol">, "color" | "content"> & {
  /** The items as data, drawn as `Item`s with `Title`s. Pass children instead to compose the parts yourself. */
  items?: OutlineTreeItemData[];
};

function OutlineTreeRoot({ items, children, ...props }: OutlineTreeProps) {
  return (
    <ol data-component="OutlineTree" {...props}>
      {items
        ? items.map((item, index) => (
            <OutlineTreeItem key={index}>
              <OutlineTreeTitle>{item.title}</OutlineTreeTitle>
              {item.children?.length ? <OutlineTreeRoot items={item.children} /> : null}
            </OutlineTreeItem>
          ))
        : children}
    </ol>
  );
}

/**
 * Numbered items with nested items hung from them on connector lines: 1, 2 / a, b / a.1 / a.1.1. The numbers and the lines are drawn by CSS
 * from the tree's shape, so a tree is right as it is first drawn and as its text changes, and an editor can build the same tree as DOM.
 *
 * ```tsx
 * <OutlineTree items={[{ title: "Plan", children: [{ title: "Write the brief" }] }, { title: "Build" }]} />
 *
 * <OutlineTree>
 *   <OutlineTree.Item>
 *     <OutlineTree.Title>Plan</OutlineTree.Title>
 *     <OutlineTree>
 *       <OutlineTree.Item><OutlineTree.Title>Write the brief</OutlineTree.Title></OutlineTree.Item>
 *     </OutlineTree>
 *   </OutlineTree.Item>
 * </OutlineTree>
 * ```
 */
export const OutlineTree = Object.assign(OutlineTreeRoot, { Item: OutlineTreeItem, Title: OutlineTreeTitle });
