import type { Editor } from "@tiptap/core";
import type { Node as ProseNode } from "@tiptap/pm/model";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import type { AnyBlock } from "../../core";
import type { BlockType } from "../blockTypes";

/** A block as the gutter sees it: a child of the page or of a column, with the position it starts at. */
export type BlockRef = { start: number; node: ProseNode };

/** The nodes whose children are blocks the gutter acts on. A block inside a column has its own gutter. */
const CONTAINERS = new Set(["doc", "column"]);

/** The block that holds a position: the nearest ancestor (or the node itself, at its own start) that is a child of the page or of a column. */
export function blockAtPos(doc: ProseNode, pos: number): BlockRef | null {
  const $pos = doc.resolve(pos);
  if (CONTAINERS.has($pos.parent.type.name) && $pos.nodeAfter) return { start: pos, node: $pos.nodeAfter };
  for (let depth = $pos.depth; depth >= 1; depth--) {
    if (CONTAINERS.has($pos.node(depth - 1).type.name)) return { start: $pos.before(depth), node: $pos.node(depth) };
  }
  return null;
}

export function selectBlock(editor: Editor, start: number) {
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, start)));
}

/** Whether a block has a sibling to swap places with in that direction. */
export function canMoveBlock(editor: Editor, start: number, direction: -1 | 1): boolean {
  const $ = editor.state.doc.resolve(start);
  const target = $.index() + direction;
  return target >= 0 && target < $.parent.childCount;
}

/** Swaps a block with its neighbour and keeps it selected. Returns where it starts now, or null when it has nowhere to go. */
export function moveBlock(editor: Editor, start: number, direction: -1 | 1): number | null {
  if (!canMoveBlock(editor, start, direction)) return null;
  const { state, view } = editor;
  const $ = state.doc.resolve(start);
  const node = $.parent.child($.index());
  const neighbour = $.parent.child($.index() + direction);
  const end = start + node.nodeSize;
  const landed = direction < 0 ? start - neighbour.nodeSize : start + neighbour.nodeSize;
  const tr = state.tr;
  if (direction < 0) tr.delete(start, end).insert(landed, node);
  else tr.insert(end + neighbour.nodeSize, node).delete(start, end);
  tr.setSelection(NodeSelection.create(tr.doc, landed));
  view.dispatch(tr);
  return landed;
}

/** Removes a block. The last block of the page or of a column becomes an empty paragraph instead, so neither is ever left empty. */
export function deleteBlock(editor: Editor, start: number) {
  const { state, view } = editor;
  const node = state.doc.nodeAt(start);
  if (!node) return;
  const tr = state.tr;
  if (state.doc.resolve(start).parent.childCount === 1) tr.replaceWith(start, start + node.nodeSize, state.schema.nodes.paragraph.create());
  else tr.delete(start, start + node.nodeSize);
  view.dispatch(tr);
}

/** Turns a block into another type, as one undoable step: the selection moves into it, then the type is applied. */
export function turnInto(editor: Editor, start: number, type: BlockType) {
  type
    .apply(
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setSelection(TextSelection.near(tr.doc.resolve(start + 1)));
          return true;
        }),
    )
    .run();
}

/**
 * Changes a block's attributes and keeps it selected. Replacing a node drops a selection of it (ProseMirror falls back to a caret beside
 * it), and a panel that is open on the block is open because the block is selected.
 */
export function setBlockAttrs(editor: Editor, start: number, attrs: Record<string, unknown>) {
  const node = editor.state.doc.nodeAt(start);
  if (!node) return;
  const tr = editor.state.tr.setNodeMarkup(start, undefined, { ...node.attrs, ...attrs });
  tr.setSelection(NodeSelection.create(tr.doc, start));
  editor.view.dispatch(tr);
}

/** Replaces a block that holds blocks (a callout) with what it holds, in place. Returns where the first of them starts. */
export function unwrapBlock(editor: Editor, start: number): number | null {
  const node = editor.state.doc.nodeAt(start);
  if (!node || node.childCount === 0) return null;
  const tr = editor.state.tr.replaceWith(start, start + node.nodeSize, node.content);
  tr.setSelection(NodeSelection.create(tr.doc, start));
  editor.view.dispatch(tr);
  return start;
}

/** The definition a block was made from (see `compile`), or none for a node the editor has no definition for (a paragraph, a list). */
export function blockOf(editor: Editor, node: ProseNode): AnyBlock | undefined {
  return editor.extensionManager.extensions.find((extension) => extension.name === node.type.name)?.options?.def;
}
