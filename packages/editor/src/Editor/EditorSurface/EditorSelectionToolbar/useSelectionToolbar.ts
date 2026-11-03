import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/** What is inside the toolbar's own reach: pressing there is not leaving the selection, even though it moves focus out of the editor. */
const OWN = '[data-component="Editor.SelectionToolbar"], [data-component="Popover"]';

/** Where the selected text is on screen, as the browser reports it; the ends of the selection when it cannot. */
function selectionRect(editor: Editor): DOMRect {
  const range = window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0) : null;
  const box = range?.getBoundingClientRect();
  if (box && (box.width > 0 || box.height > 0)) return box;
  try {
    const { from, to } = editor.state.selection;
    const a = editor.view.coordsAtPos(from);
    const b = editor.view.coordsAtPos(to);
    return new DOMRect(Math.min(a.left, b.left), Math.min(a.top, b.top), Math.abs(b.right - a.left), Math.abs(b.bottom - a.top));
  } catch {
    return new DOMRect();
  }
}

/**
 * Whether the selection toolbar is showing, and where. It shows for a selection of text while the editor has focus, and stays while the
 * pointer works inside the toolbar or its popups (a swatch panel takes focus, and the selection must not be lost to it). A press anywhere
 * else, or Escape, lets it go.
 */
export function useSelectionToolbar(editor: Editor) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const engaged = useRef(false);

  const update = useCallback(() => {
    const { selection } = editor.state;
    const selecting = selection instanceof TextSelection && !selection.empty && editor.isEditable;
    if (!selecting || (!editor.view.hasFocus() && !engaged.current)) return setRect(null);
    setRect(selectionRect(editor));
  }, [editor]);

  useEffect(() => {
    const onTransaction = () => (update(), redraw());
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      engaged.current = !!target?.closest?.(OWN);
      if (!engaged.current) update();
    };
    editor.on("transaction", onTransaction);
    editor.on("focus", update);
    editor.on("blur", update);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      editor.off("transaction", onTransaction);
      editor.off("focus", update);
      editor.off("blur", update);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [editor, update]);

  const release = useCallback(() => {
    engaged.current = false;
    update();
  }, [update]);

  return { rect, release };
}
