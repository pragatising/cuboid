import React from "react";
import { clsx } from "clsx";
import { useResizable } from "../../../behaviors";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { Length } from "../../../utils/space";
import { Box } from "../Box";
import type { BoxOwnProps } from "../Box";
import classes from "./ResizeHandle.module.css";

/** Which edge of the panel the handle sits on. */
export type ResizeHandleEdge = "left" | "right" | "top" | "bottom";

export type ResizeHandleProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "onChange" | "color"> & {
  /** Which edge of the parent panel the handle sits on: it resizes the width for `left` / `right` and the height for `top` / `bottom`. */
  edge: ResizeHandleEdge;
  /** The panel's current size in px. */
  value: number;
  min: number;
  max: number;
  /** How far an arrow key moves it, in px (Shift moves five times as far). @default 16 */
  step?: number;
  /** Called with the next size in px, clamped to `min` / `max`, by pointer drag or by keyboard. */
  onValueChange: (px: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
};

/**
 * The drag handle of a resizable panel (Sheet, Sidebar…), and its keyboard equivalent: a focusable
 * `role="separator"` (the WAI-ARIA window splitter) that Arrow keys, Home and End also move. The hit area comes from the
 * `resizeHandle` token. The parent must be `position: relative` (or fixed) with room for the handle.
 */
export function ResizeHandle({ edge, value, min, max, step, onValueChange, onResizeStart, onResizeEnd, className, ...props }: ResizeHandleProps) {
  const { resizeHandle, focusRing } = useTokens();
  const orientation = edge === "left" || edge === "right" ? "vertical" : "horizontal";
  // A handle on the panel's left or top edge grows the panel as the pointer moves toward that edge.
  const { separatorProps, dragging } = useResizable({
    orientation,
    value,
    min,
    max,
    step,
    invert: edge === "left" || edge === "top",
    onChange: onValueChange,
    onResizeStart,
    onResizeEnd,
  });

  const hitArea = resolved<Length>(resizeHandle.hitArea);
  const size: BoxOwnProps = orientation === "vertical" ? { top: 0, bottom: 0, width: hitArea } : { left: 0, right: 0, height: hitArea };
  // The handle straddles the panel's edge: half in, half out.
  const placement: Record<ResizeHandleEdge, BoxOwnProps> = {
    left: { left: 0, transform: "translateX(-50%)" },
    right: { right: 0, transform: "translateX(50%)" },
    top: { top: 0, transform: "translateY(-50%)" },
    bottom: { bottom: 0, transform: "translateY(50%)" },
  };

  return (
    <Box
      {...mergeProps(
        {
          "data-component": "ResizeHandle",
          "data-orientation": orientation,
          "data-edge": edge,
          "data-dragging": dragging ? "" : undefined,
          "aria-label": "Resize",
          className: clsx(classes.ResizeHandle, className),
          style: cssVars("resizeHandle", { focusColor: focusRing.color, focusWidth: focusRing.width, focusOffset: focusRing.offset }),
        },
        { ...separatorProps, ...props },
      )}
      display="block"
      position="absolute"
      zIndex={1}
      touchAction="none"
      cursor={orientation === "vertical" ? "col-resize" : "row-resize"}
      {...size}
      {...placement[edge]}
    />
  );
}
