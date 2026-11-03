import React from "react";
import { clsx } from "clsx";
import { useResizable } from "../../../behaviors";
import { useTokens } from "../../../mode";
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
  /**
   * When the handle draws its line. `hover`: only while the pointer is over it, it has focus, or it is being dragged (then it turns
   * the focus colour). `always`: also at rest, in a muted colour, for a divider that must be found without hovering.
   * @default "hover"
   */
  indicator?: "hover" | "always";
  /**
   * What it draws. `line`: a line the length of the edge. `grip`: a short bar on the middle of the edge, always drawn (it is how a handle on a
   * picture or a card says it can be dragged), which turns the focus colour while hovered, focused or dragged. @default "line"
   */
  shape?: "line" | "grip";
};

/**
 * The drag handle of a resizable panel (Sheet, Sidebar…), and its keyboard equivalent: a focusable
 * `role="separator"` (the WAI-ARIA window splitter) that Arrow keys, Home and End also move. The hit area comes from the
 * `resizeHandle` token. It draws a line down its middle (see `indicator`), which turns the focus colour and thickens while the handle is
 * hovered, focused or dragged: the focus indication, so there is no outline around the hit area. The parent must be `position: relative` (or fixed) with room for the handle.
 */
export function ResizeHandle({ edge, value, min, max, step, onValueChange, onResizeStart, onResizeEnd, indicator = "hover", shape = "line", className, ...props }: ResizeHandleProps) {
  const { resizeHandle } = useTokens();
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
          "data-indicator": indicator,
          "data-shape": shape,
          "aria-label": "Resize",
          className: clsx(classes.ResizeHandle, className),
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
