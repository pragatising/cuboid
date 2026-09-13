import React, { CSSProperties, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import styles from "./Overlay.module.css";

export type OverlayVariant = "modal" | "sheet" | "none";

export interface OverlayProps {
  /** When false, nothing is rendered. */
  open?: boolean;
  /** Scrim strength — `modal` blocks strongly, `sheet` is lighter, `none` is transparent and non-blocking. */
  variant?: OverlayVariant;
  /** Called when the scrim is clicked or Escape is pressed. Omit for a non-dismissible backdrop. */
  onDismiss?: () => void;
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
}

function variantCssVars(
  colors: { modal: string; sheet: string; none: string },
  zIndex: string
): React.CSSProperties {
  return {
    "--cube-overlay-modal-bg": colors.modal,
    "--cube-overlay-sheet-bg": colors.sheet,
    "--cube-overlay-none-bg": colors.none,
    "--cube-z-index-overlay": zIndex,
  } as React.CSSProperties;
}

/**
 * Full-viewport scrim layer — portaled to `document.body`.
 *
 * Use beneath Dialog (modal variant) or Sheet (sheet variant). Does not trap
 * focus or lock scroll; those belong on Dialog / Sheet.
 */
export function Overlay({
  open = false,
  variant = "modal",
  onDismiss,
  theme,
  className,
  style,
}: OverlayProps) {
  const tokens = useTheme(theme);
  const { overlay } = tokens.colors.functional;
  const zIndex = tokens.sizes.zIndex.overlay;

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

  const inlineVars = theme ? variantCssVars(overlay, zIndex) : undefined;

  const classNames = [
    styles.Overlay,
    styles[`Overlay--${variant}`],
    onDismiss && variant !== "none" ? styles["Overlay--dismissible"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <button
      type="button"
      className={classNames}
      style={{ ...inlineVars, ...style }}
      aria-hidden="true"
      tabIndex={-1}
      onClick={onDismiss && variant !== "none" ? onDismiss : undefined}
    />,
    document.body
  );
}
