import React, { useCallback, useRef } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import styles from "./ResizeHandle.module.css";

export type ResizeHandleOrientation = "vertical" | "horizontal";
export type ResizeHandleEdge = "start" | "end" | "top" | "bottom";

export interface ResizeHandleProps {
  /** `vertical` = width; `horizontal` = height */
  orientation?: ResizeHandleOrientation;
  /** Which edge of the parent panel the handle sits on */
  edge: ResizeHandleEdge;
  /** Pointer delta in px — positive = toward end/bottom edge of screen axis */
  onResizeDelta: (deltaPx: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  "aria-label"?: string;
  theme?: CubeTheme;
  className?: string;
}

const EDGE_CLASS: Record<ResizeHandleEdge, string> = {
  start: styles["ResizeHandle--edgeStart"],
  end: styles["ResizeHandle--edgeEnd"],
  top: styles["ResizeHandle--edgeTop"],
  bottom: styles["ResizeHandle--edgeBottom"],
};

/**
 * Shared drag affordance for resizable panels — used by Sheet, Sidebar, etc.
 * Parent must be `position: relative` (or fixed) with room for the handle.
 */
export function ResizeHandle({
  orientation = "vertical",
  edge,
  onResizeDelta,
  onResizeStart,
  onResizeEnd,
  "aria-label": ariaLabel = "Resize",
  theme,
  className,
}: ResizeHandleProps) {
  const tokens = useTheme(theme);
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const inlineVars = theme
    ? ({
        "--cube-resizeHandle-hitArea": tokens.sizes.resizeHandle.hitArea,
      } as React.CSSProperties)
    : undefined;

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      dragging.current = true;
      lastPos.current = orientation === "vertical" ? event.clientX : event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
      onResizeStart?.();
    },
    [onResizeStart, orientation]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current) return;
      const pos = orientation === "vertical" ? event.clientX : event.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      if (delta !== 0) onResizeDelta(delta);
    },
    [onResizeDelta, orientation]
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
    [onResizeEnd]
  );

  const classNames = [
    "cube-focusable",
    styles.ResizeHandle,
    styles[`ResizeHandle--${orientation}`],
    EDGE_CLASS[edge],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      style={inlineVars}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}
