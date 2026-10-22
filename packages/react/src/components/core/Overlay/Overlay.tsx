import React from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useEscape } from "../../../behaviors";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import type { CssColor } from "../../../utils/colorPaths";
import { resolved } from "../../../utils/resolved";
import { Box } from "../Box";
import classes from "./Overlay.module.css";

/** A key of `tokens.overlay.color`. */
export type OverlayVariant = "modal" | "sheet" | "none";

export type OverlayProps = Omit<React.ComponentPropsWithRef<"button">, "children"> & {
  /** When false, nothing is rendered. @default false */
  open?: boolean;
  /** Scrim strength: `modal` blocks strongly, `sheet` is lighter, `none` is transparent and non-blocking. @default "modal" */
  variant?: OverlayVariant;
  /** Called when the scrim is clicked or Escape is pressed (Escape: only if this is the top-most layer). Omit for a non-dismissible backdrop. */
  onDismiss?: () => void;
};

/**
 * Full-viewport scrim layer, portaled to `document.body`.
 *
 * Use beneath Dialog (modal variant) or Sheet (sheet variant). It does not trap focus or lock scroll; those belong to the
 * layer above it (`useFocusTrap`, `useScrollLock`).
 */
export function Overlay({ open = false, variant = "modal", onDismiss, className, ...props }: OverlayProps) {
  const { overlay, zIndex } = useTokens();
  useEscape(() => onDismiss?.(), open && Boolean(onDismiss));

  if (!open || typeof document === "undefined") return null;

  const dismissible = Boolean(onDismiss) && variant !== "none";

  return createPortal(
    <Box
      as="button"
      {...mergeProps(
        {
          "data-component": "Overlay",
          "data-variant": variant,
          "data-dismissible": dismissible ? "" : undefined,
          type: "button" as const,
          className: clsx(classes.Overlay, className),
          "aria-hidden": true,
          tabIndex: -1,
          onClick: dismissible ? onDismiss : undefined,
        },
        props as object,
      )}
      display="block"
      position="fixed"
      inset={0}
      padding={0}
      margin={0}
      border="none"
      appearance="none"
      backgroundColor={resolved<CssColor>(overlay.color[variant])}
      zIndex={zIndex.overlay}
      cursor={dismissible ? "pointer" : "default"}
      pointerEvents={variant === "none" ? "none" : undefined}
    />,
    document.body,
  );
}
