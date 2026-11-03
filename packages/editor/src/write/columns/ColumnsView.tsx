import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Box, ResizeHandle } from "@sragatiping/cuboid";
import classes from "./ColumnsView.module.css";
import { MIN_COLUMN_WIDTH } from "./constants";

type Box = { left: number; width: number };

/** The row of columns, and a divider between each pair. Widths are the columns' `flex` attributes; a drag previews them and saves once. */
export function ColumnsView({ node, editor, getPos }: NodeViewProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const shares = useRef<number[]>([]);
  const dragging = useRef(false);
  const latest = useRef(node);
  latest.current = node;

  const columnElements = () => Array.from(rowRef.current?.querySelectorAll<HTMLElement>("[data-node-view-content] [data-column]") ?? []);

  const measure = useCallback(() => {
    setBoxes(columnElements().map((el) => ({ left: el.offsetLeft, width: el.offsetWidth })));
  }, []);

  // The shares shown are the document's, except while a divider is being dragged.
  useLayoutEffect(() => {
    if (!dragging.current) shares.current = node.content.content.map((column) => Number(column.attrs.flex));
    measure();
  }, [node, measure]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [measure]);

  const commit = () => {
    const base = getPos();
    if (typeof base !== "number") return;
    const tr = editor.state.tr;
    let at = base + 1;
    latest.current.forEach((column, _offset, index) => {
      tr.setNodeMarkup(at, undefined, { ...column.attrs, flex: shares.current[index] });
      at += column.nodeSize;
    });
    editor.view.dispatch(tr);
  };

  /** Moves the divider after column `i` so the column before it is `leftWidth` px, taking from or giving to the one after. */
  const resize = (i: number, leftWidth: number) => {
    const els = columnElements();
    const pair = els[i].offsetWidth + els[i + 1].offsetWidth;
    const total = shares.current[i] + shares.current[i + 1];
    const share = Math.min(Math.max(leftWidth, MIN_COLUMN_WIDTH), pair - MIN_COLUMN_WIDTH) / pair;
    shares.current[i] = total * share;
    shares.current[i + 1] = total * (1 - share);
    els[i].style.flex = `${shares.current[i]} 1 0`;
    els[i + 1].style.flex = `${shares.current[i + 1]} 1 0`;
    measure();
    // A key press has no end event: it is saved as it happens. A drag is saved when it is released.
    if (!dragging.current) commit();
  };

  return (
    <Box as={NodeViewWrapper} position="relative" data-component="Columns">
      <div ref={rowRef}>
        <NodeViewContent className={classes.Row} />
      </div>
      <Box position="absolute" inset={0} pointerEvents="none" contentEditable={false}>
        {boxes.slice(0, -1).map((box, i) => {
          const gap = boxes[i + 1].left - (box.left + box.width);
          const pair = box.width + boxes[i + 1].width;
          return (
            <Box key={i} position="absolute" top={0} bottom={0} left={`${box.left}px`} width={`${box.width + gap / 2}px`}>
              <ResizeHandle
                edge="right"
                aria-label={`Resize column ${i + 1}`}
                value={box.width + gap / 2}
                min={MIN_COLUMN_WIDTH + gap / 2}
                max={pair - MIN_COLUMN_WIDTH + gap / 2}
                onValueChange={(px) => resize(i, px - gap / 2)}
                onResizeStart={() => (dragging.current = true)}
                onResizeEnd={() => {
                  dragging.current = false;
                  commit();
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
