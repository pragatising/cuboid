import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Editor } from "@tiptap/core";
import { BLOCK_TYPES, blockTypeGroups, typeOf } from "../../../write/blockTypes";
import { ActionMenu, Box, Icon } from "@sragatiping/cuboid";
import { blockAtPos, blockOf, canMoveBlock, deleteBlock, moveBlock, selectBlock, setBlockAttrs, turnInto, unwrapBlock } from "../../../write/blockCommands";
import type { BlockRef } from "../../../write/blockCommands";
import { EditorBlockMenu } from "./EditorBlockMenu";
import { GUTTER_HIDE_MS, GUTTER_HOLD_MS, GUTTER_REACH, firstLineCenterY } from "./layout";

/** Where the gutter is: the block it is for, and the spot beside that block's first line, in the surface's own coordinates. */
type Anchor = { start: number; top: number; left: number };

const TURN_INTO = blockTypeGroups(BLOCK_TYPES, true);

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** The block under the pointer. The x is held inside the text column, so the pointer in the margin still finds the row it is level with. */
function blockAtPoint(editor: Editor, x: number, y: number): BlockRef | null {
  const { view } = editor;
  const box = view.dom.getBoundingClientRect();
  const found = view.posAtCoords({ left: clamp(x, box.left + 8, box.right - 8), top: y });
  return found ? blockAtPos(view.state.doc, found.inside >= 0 ? found.inside : found.pos) : null;
}

const holdsSelection = (editor: Editor, block: BlockRef) => {
  const { from, to } = editor.state.selection;
  return from >= block.start && to <= block.start + block.node.nodeSize;
};

export type EditorBlockGutterProps = { editor: Editor; container: RefObject<HTMLElement | null> };

/**
 * One gutter for the whole page, beside whichever block the pointer is over: `+` turns the block into another type, the grip drags it
 * and opens its actions. Blocks inside columns get their own. While a block is being typed in, the gutter waits for the pointer to
 * rest on it; the gutter itself is always instant. It stays while a menu is open.
 */
function EditorBlockGutterRoot({ editor, container }: EditorBlockGutterProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [pinned, setPinned] = useState(false);
  /** The block whose settings panel is open (a callout's colours). While it is, the gutter stays. */
  const [panelFor, setPanelFor] = useState<number | null>(null);
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const bar = useRef<HTMLDivElement>(null);
  const timers = useRef({ hide: 0, hold: 0 });
  const live = useRef({ anchor, pinned, acting: false });
  live.current.anchor = anchor;
  live.current.pinned = pinned || panelFor !== null;

  const place = useCallback(
    (start: number): Anchor | null => {
      const host = container.current;
      const dom = editor.view.nodeDOM(start);
      if (!host || !(dom instanceof HTMLElement)) return null;
      const hostBox = host.getBoundingClientRect();
      const box = dom.getBoundingClientRect();
      // A block that holds nothing (an image, a divider) has no first line, whatever text its own controls and placeholders show: its gutter is level with its top.
      const atom = editor.state.doc.nodeAt(start)?.isAtom ?? false;
      return { start, top: ((atom ? null : firstLineCenterY(dom)) ?? box.top + 12) - hostBox.top, left: box.left - hostBox.left };
    },
    [editor, container],
  );

  const hideSoon = useCallback(() => {
    window.clearTimeout(timers.current.hide);
    timers.current.hide = window.setTimeout(() => !live.current.pinned && setAnchor(null), GUTTER_HIDE_MS);
  }, []);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const t = timers.current;
    const onMove = (event: MouseEvent) => {
      const target = event.target as Element | null;
      // A menu or panel opened from the gutter is not the page: pointing at it changes nothing.
      if (live.current.pinned || bar.current?.contains(target) || target?.closest?.('[data-component="Popover"]')) return;
      // The pointer is on a block when it is level with it anywhere across the text and the margin to its left, whatever the height of the block.
      const box = host.getBoundingClientRect();
      const within = event.clientX >= box.left - GUTTER_REACH && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      const found = within ? blockAtPoint(editor, event.clientX, event.clientY) : null;
      const next = found && place(found.start);
      if (!found || !next) return hideSoon();
      window.clearTimeout(t.hide);
      window.clearTimeout(t.hold);
      const typingHere = editor.view.hasFocus() && holdsSelection(editor, found) && live.current.anchor?.start !== found.start;
      if (typingHere) t.hold = window.setTimeout(() => setAnchor(place(found.start)), GUTTER_HOLD_MS);
      else setAnchor((was) => (was && was.start === next.start && was.top === next.top && was.left === next.left ? was : next));
    };
    // On the document, not the editor: the margin beside the text is not inside the editor, and that is where the gutter is reached from.
    const onLeaveWindow = (event: MouseEvent) => event.relatedTarget === null && hideSoon();
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseout", onLeaveWindow);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseout", onLeaveWindow);
      window.clearTimeout(t.hide);
      window.clearTimeout(t.hold);
    };
  }, [editor, container, place, hideSoon]);

  // An edit anywhere else moves blocks under the gutter: hide it rather than leave it beside the wrong one. The gutter's own edits re-place it.
  useEffect(() => {
    const onUpdate = () => (live.current.acting ? undefined : !live.current.pinned && setAnchor(null));
    const onTransaction = () => redraw();
    editor.on("update", onUpdate);
    editor.on("transaction", onTransaction);
    return () => void (editor.off("update", onUpdate), editor.off("transaction", onTransaction));
  }, [editor]);

  const acting = (run: () => void) => {
    live.current.acting = true;
    try {
      run();
    } finally {
      live.current.acting = false;
    }
  };

  const node = anchor ? editor.state.doc.nodeAt(anchor.start) : null;
  if (!anchor || !node) return null;
  const { start } = anchor;
  // What the block brings of its own (a settings panel) and whether it can be taken out of what it wraps: read from its definition, so the gutter knows no block by name.
  const def = blockOf(editor, node);
  const settings = def?.settings;
  const unwrappable = def?.holds === "blocks";
  const label = (BLOCK_TYPES.find((type) => type.value === typeOf(node))?.label ?? node.type.name).toLowerCase();

  return (
    <Box
      ref={bar}
      position="absolute"
      zIndex={1}
      top={`${anchor.top}px`}
      left={`${anchor.left}px`}
      transform="translate(-100%, -50%)"
      // Bridges the gap to the block, so the pointer can reach the gutter.
      paddingInlineEnd="2x"
      data-component="Editor.BlockGutter"
      onMouseEnter={() => window.clearTimeout(timers.current.hide)}
      onMouseLeave={() => !live.current.pinned && hideSoon()}
    >
      <EditorBlockMenu
        types={TURN_INTO}
        current={typeOf(node)}
        onTransform={(value) => {
          const type = BLOCK_TYPES.find((t) => t.value === value);
          if (type) acting(() => turnInto(editor, start, type));
          setAnchor(place(start));
        }}
        onMoveUp={canMoveBlock(editor, start, -1) ? () => acting(() => setAnchor(place(moveBlock(editor, start, -1) ?? start))) : undefined}
        onMoveDown={canMoveBlock(editor, start, 1) ? () => acting(() => setAnchor(place(moveBlock(editor, start, 1) ?? start))) : undefined}
        onDelete={() => acting(() => (deleteBlock(editor, start), setAnchor(null)))}
        onSelectBlock={() => acting(() => selectBlock(editor, start))}
        actions={
          settings ? (
            <ActionMenu.Item leadingVisual={<Icon name={settings.icon} />} onClick={() => setPanelFor(start)}>
              {settings.label}
            </ActionMenu.Item>
          ) : undefined
        }
        trailingActions={
          unwrappable ? (
            <ActionMenu.Item leadingVisual={<Icon name="chat_info" />} onClick={() => acting(() => (unwrapBlock(editor, start), setAnchor(place(start))))}>
              Remove {label} (keep contents)
            </ActionMenu.Item>
          ) : undefined
        }
        onMenuOpenChange={(open) => {
          setPinned(open);
          if (!open) hideSoon();
        }}
        gripProps={{
          draggable: true,
          onDragStart: (event) => {
            selectBlock(editor, start);
            const { view } = editor;
            view.dragging = { slice: view.state.selection.content(), move: true };
            const dom = view.nodeDOM(start);
            if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 0, 0);
            event.dataTransfer.effectAllowed = "move";
          },
          onDragEnd: () => setAnchor(null),
        }}
      />
      {panelFor !== null && settings ? (
        <settings.Panel
          anchor={bar}
          attrs={node.attrs}
          update={(attrs) => acting(() => setBlockAttrs(editor, panelFor, attrs))}
          onClose={() => (setPanelFor(null), hideSoon())}
        />
      ) : null}
    </Box>
  );
}

/** The gutter and the menu it opens: `EditorBlockGutter.BlockMenu`. */
export const EditorBlockGutter = Object.assign(EditorBlockGutterRoot, { BlockMenu: EditorBlockMenu });
