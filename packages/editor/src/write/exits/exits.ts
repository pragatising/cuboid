import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Selection, TextSelection } from "@tiptap/pm/state";

/** Blocks you leave by pressing Enter on an empty line (or the arrow keys): text, and what is made of it. Every other block needs a way out. */
const TEXT_LIKE = new Set(["paragraph", "heading", "bulletList", "orderedList", "blockquote"]);

/**
 * Puts the cursor in a paragraph at the end of the page, adding one when the page ends in a block that is not text (a code block, a divider, an
 * image, a callout, columns, and whatever block comes next), which has no line after it to arrow or click into. One rule for every block, not one
 * for each. A page that already ends in text is left as it is, and the cursor goes to its end.
 */
export function focusEnd(editor: Editor): boolean {
  const { state, view } = editor;
  const last = state.doc.lastChild;
  const paragraph = state.schema.nodes.paragraph;
  if (!last || TEXT_LIKE.has(last.type.name) || !paragraph) return editor.chain().focus("end").run();
  const at = state.doc.content.size;
  const tr = state.tr.insert(at, paragraph.create());
  view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(at + 1))).scrollIntoView());
  view.focus();
  return true;
}

/**
 * Leaves the block the cursor is in, forward: into the next block, or into a new paragraph when it is the last in its container. `depth` names the node to
 * leave when it is not the cursor's own parent (a table, from a cell).
 */
export function exitForward(editor: Editor, depth?: number): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  if ($from.depth === 0) return false;
  const after = $from.after(depth);
  const next = Selection.findFrom(state.doc.resolve(after), 1, true);
  const stays = state.doc.resolve(after).nodeAfter !== null && next !== null;
  if (stays) {
    view.dispatch(state.tr.setSelection(next!).scrollIntoView());
    return true;
  }
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) return false;
  const tr = state.tr.insert(after, paragraph.create());
  view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1))).scrollIntoView());
  return true;
}

/** Leaves the block backward, into the end of the one before it. False when there is none (the first block of the page). */
function exitBackward(editor: Editor): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  if ($from.depth === 0) return false;
  const before = Selection.findFrom(state.doc.resolve($from.before()), -1, true);
  if (!before) return false;
  view.dispatch(state.tr.setSelection(before).scrollIntoView());
  return true;
}

/**
 * Ways out of a block, so the cursor is never stuck in one. ArrowDown at the very end of a page that ends in a block that is not text (a callout,
 * columns, an image) adds a paragraph below it and goes there. And, for a block made of plain text, which Enter and the arrow keys would otherwise keep you inside (a code block's Enter is a new line):
 * ArrowDown on the last line goes to the next block, or to a new paragraph below it at the end; ArrowUp on the first line goes to the one before;
 * Enter on an empty last line (a second Enter) leaves it, taking the empty line with it; Mod-Enter leaves it at once. Any block that holds plain
 * text (`code: true`) has them, so a block added later does too.
 */
export const BlockExits = Extension.create({
  name: "blockExits",
  addKeyboardShortcuts() {
    const inCode = () => {
      const { selection } = this.editor.state;
      return selection.empty && selection.$from.parent.type.spec.code === true ? selection.$from : null;
    };
    const atEnd = () => {
      const $from = inCode();
      return $from !== null && $from.parentOffset === $from.parent.content.size ? $from : null;
    };
    /** The cursor is at the end of the last text of the page's last block, and that block is not text: nothing below it to arrow into. */
    const atEndOfPage = () => {
      const { selection, doc } = this.editor.state;
      const { $from } = selection;
      if (!selection.empty || $from.depth === 0 || $from.parentOffset !== $from.parent.content.size) return false;
      const last = doc.lastChild;
      return $from.after(1) === doc.content.size && Boolean(last) && !TEXT_LIKE.has(last!.type.name);
    };
    return {
      ArrowDown: () => (atEnd() ? exitForward(this.editor) : atEndOfPage() ? focusEnd(this.editor) : false),
      ArrowUp: () => {
        const $from = inCode();
        return $from !== null && $from.parentOffset === 0 ? exitBackward(this.editor) : false;
      },
      "Mod-Enter": () => (inCode() ? exitForward(this.editor) : false),
      Enter: () => {
        const $from = atEnd();
        if (!$from || !$from.parent.textContent.endsWith("\n")) return false;
        // The empty last line goes, and the cursor goes below the block.
        this.editor.view.dispatch(this.editor.state.tr.delete($from.pos - 1, $from.pos));
        return exitForward(this.editor);
      },
    };
  },
});
