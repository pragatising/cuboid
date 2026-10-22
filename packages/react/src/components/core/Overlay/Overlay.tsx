import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Overlay.module.css";

/** A key of `tokens.overlay.color`. */
export type OverlayVariant = "modal" | "sheet" | "none";

export type OverlayProps = Omit<React.ComponentPropsWithRef<"button">, "children"> & {
  /** When false, nothing is rendered. @default false */
  open?: boolean;
  /** Scrim strength: `modal` blocks strongly, `sheet` is lighter, `none` is transparent and non-blocking. @default "modal" */
  variant?: OverlayVariant;
  /** Called when the scrim is clicked or Escape is pressed. Omit for a non-dismissible backdrop. */
  onDismiss?: () => void;
};

/**
 * Full-viewport scrim layer, portaled to `document.body`.
 *
 * Use beneath Dialog (modal variant) or Sheet (sheet variant). Does not trap
 * focus or lock scroll; those belong on Dialog / Sheet.
 */
export function Overlay({ open = false, variant = "modal", onDismiss, className, ...props }: OverlayProps) {
  const { overlay, zIndex } = useTokens();

  useEffect(() => {
    if (!open || !onDismiss) return;
    const dismiss = onDismiss;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;

  const dismissible = Boolean(onDismiss) && variant !== "none";

  return createPortal(
    <button
      {...mergeProps(
        {
          "data-component": "Overlay",
          "data-variant": variant,
          "data-dismissible": dismissible ? "" : undefined,
          type: "button" as const,
          className: clsx(classes.Overlay, className),
          style: { backgroundColor: overlay.color[variant], zIndex: zIndex.overlay },
          "aria-hidden": true,
          tabIndex: -1,
          onClick: dismissible ? onDismiss : undefined,
        },
        props,
      )}
    />,
    document.body,
  );
}
