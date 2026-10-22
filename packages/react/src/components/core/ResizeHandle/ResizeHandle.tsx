import React, { useCallback, useRef } from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./ResizeHandle.module.css";

export type ResizeHandleOrientation = "vertical" | "horizontal";
export type ResizeHandleEdge = "start" | "end" | "top" | "bottom";

export type ResizeHandleProps = Omit<React.ComponentPropsWithRef<"button">, "children"> & {
  /** `vertical` = width; `horizontal` = height. @default "vertical" */
  orientation?: ResizeHandleOrientation;
  /** Which edge of the parent panel the handle sits on */
  edge: ResizeHandleEdge;
  /** Pointer delta in px: positive = toward the end/bottom of the screen axis */
  onResizeDelta: (deltaPx: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
};

/**
 * Shared drag affordance for resizable panels (Sheet, Sidebar…). The hit area comes from the
 * `resizeHandle` token. The parent must be `position: relative` (or fixed) with room for the handle.
 */
export function ResizeHandle({
  orientation = "vertical",
  edge,
  onResizeDelta,
  onResizeStart,
  onResizeEnd,
  className,
  ...props
}: ResizeHandleProps) {
  const { resizeHandle, focusRing } = useTokens();
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      dragging.current = true;
      lastPos.current = orientation === "vertical" ? event.clientX : event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
      onResizeStart?.();
    },
    [onResizeStart, orientation],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current) return;
      const pos = orientation === "vertical" ? event.clientX : event.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      if (delta !== 0) onResizeDelta(delta);
    },
    [onResizeDelta, orientation],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      onResizeEnd?.();
    },
    [onResizeEnd],
  );

  return (
    <button
      {...mergeProps(
        {
          "data-component": "ResizeHandle",
          "data-orientation": orientation,
          "data-edge": edge,
          type: "button" as const,
          className: clsx(classes.ResizeHandle, className),
          style: {
            [orientation === "vertical" ? "width" : "height"]: resizeHandle.hitArea,
            ...cssVars("resizeHandle", { focusColor: focusRing.color, focusWidth: focusRing.width, focusOffset: focusRing.offset }),
          },
          "aria-label": "Resize",
          onPointerDown,
          onPointerMove,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
        },
        props,
      )}
    />
  );
}
