import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseNode, ResolvedPos } from "@tiptap/pm/model";

/** How many levels an outline has: 1, a, a.1, a.1.1. A document may hold more (it is drawn), but Tab does not make more. */
export const OUTLINE_MAX_LEVELS = 4;

const TREE = "outlineTree";
const ITEM = "outlineItem";

/** The level of the item the position is in: 1 for a root item. */
const levelAt = ($pos: ResolvedPos): number => {
  let level = 0;
  for (let depth = $pos.depth; depth > 0; depth--) if ($pos.node(depth).type.name === TREE) level++;
  return level;
};

/** How many levels an item spans: itself, and the deepest item under it. */
const heightOf = (item: ProseNode): number => {
  const tree = item.childCount > 1 ? item.child(1) : null;
  let deepest = 0;
  tree?.forEach((child) => void (deepest = Math.max(deepest, heightOf(child))));
  return 1 + deepest;
};

/**
 * An item of an outline: a title (a paragraph) and, after it, the outline hung from it. It is what Enter, Tab and Backspace act on, as a list item is:
 * Enter starts the next item, Tab sets the item (and what hangs from it) one level in under the item above it, Shift-Tab one level out, and Backspace at
 * the start of a title takes the item out a level (out of the outline, from the root). The lines and numbers are Cuboid's, drawn from the shape.
 */
export const OutlineItem = Node.create({
  name: ITEM,
  content: `paragraph ${TREE}?`,
  defining: true,
  parseHTML: () => [{ tag: 'li[data-component="OutlineTree.Item"]' }],
  renderHTML: ({ HTMLAttributes }) => ["li", mergeAttributes(HTMLAttributes, { "data-component": "OutlineTree.Item" }), 0],
  addKeyboardShortcuts() {
    const inItem = () => {
      const { selection } = this.editor.state;
      return selection.$from.node(-1)?.type.name === ITEM ? selection.$from : null;
    };
    const atStart = () => {
      const { selection } = this.editor.state;
      const $from = inItem();
      return $from !== null && selection.empty && $from.parentOffset === 0 ? $from : null;
    };
    return {
      Enter: () => inItem() !== null && this.editor.commands.splitListItem(ITEM),
      Tab: () => {
        const $from = inItem();
        if (!$from) return false;
        const item = $from.node(-1);
        // A key that is not used here still must not move focus out of the editor, so a Tab that cannot indent is taken and does nothing.
        if (levelAt($from) + heightOf(item) <= OUTLINE_MAX_LEVELS) this.editor.commands.sinkListItem(ITEM);
        return true;
      },
      "Shift-Tab": () => {
        const $from = inItem();
        if (!$from) return false;
        if (levelAt($from) > 1) this.editor.commands.liftListItem(ITEM);
        return true;
      },
      Backspace: () => (atStart() ? this.editor.commands.liftListItem(ITEM) : false),
    };
  },
});
