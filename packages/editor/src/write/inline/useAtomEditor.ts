import { useEffect, useRef } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import type { NodeViewProps } from "@tiptap/react";

/**
 * Selecting an inline atom opens its editor, and leaving it puts the caret after it. So the atom is edited where it stands, with no state
 * of its own to keep in step with the selection: the selection is the state.
 */
export function useAtomEditor({ editor, getPos, selected }: NodeViewProps, removeIf?: (attrs: Record<string, unknown>) => boolean) {
  const open = selected && editor.isEditable;
  const field = useRef<HTMLInputElement>(null);

  // The popover puts focus on its panel; the field the person came to type in is focused here, once it is open.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => field.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const dismiss = useRef<() => void>(() => undefined);
  dismiss.current = () => {
    const at = getPos();
    const current = typeof at === "number" ? editor.state.doc.nodeAt(at) : null;
    if (typeof at !== "number" || !current) return;
    if (removeIf?.(current.attrs)) editor.chain().focus().deleteRange({ from: at, to: at + current.nodeSize }).run();
    else editor.chain().focus().setTextSelection(at + current.nodeSize).run();
  };

  // The popover's own dismissal is off, because it counts a press in a panel opened from it (the colour swatches) as a press outside it.
  // A press inside the editor's atom or any popover is not leaving; a press anywhere else, or Escape, is.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.('[data-component="Popover"], [data-node-view-wrapper]')) dismiss.current();
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && dismiss.current();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return {
    open,
    field,
    dismiss: () => dismiss.current(),
    select: () => {
      const at = getPos();
      // No `.focus()`: it defers a frame, and would pull focus back into the editor after the field has taken it.
      if (typeof at === "number") editor.chain().setNodeSelection(at).run();
    },
    /**
     * Changes the atom's attributes and keeps it selected. Replacing a node drops a selection of it (ProseMirror falls back to a caret
     * beside it), which would close the editor on the first keystroke, so the selection is put back in the same step. Focus stays where it is.
     */
    update: (attrs: Record<string, unknown>) => {
      const at = getPos();
      const current = typeof at === "number" ? editor.state.doc.nodeAt(at) : null;
      if (typeof at !== "number" || !current) return;
      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeMarkup(at, undefined, { ...current.attrs, ...attrs });
          tr.setSelection(NodeSelection.create(tr.doc, at));
          return true;
        })
        .run();
    },
  };
}
