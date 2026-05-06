import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import styles from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Tooltip content (non-interactive label) */
  content: React.ReactNode;
  /** Anchor element(s); must be a single React element that accepts event props */
  children: React.ReactElement;
  placement?: TooltipPlacement;
  /** Single line + ellipsis + narrow max-width (Figma truncated variant) */
  compact?: boolean;
  /** Milliseconds before showing after hover/focus */
  showDelay?: number;
  theme?: CubeTheme;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = "bottom",
  compact = false,
  showDelay = 200,
  theme,
  className,
}: TooltipProps) {
  useTheme(theme);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setOpen(true), showDelay);
  }, [clearTimer, showDelay]);

  const hide = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hide]);

  const trigger = useMemo(() => {
    return React.cloneElement(children, {
      "aria-describedby": open ? tooltipId : undefined,
      onMouseEnter: (e: React.MouseEvent) => {
        (children.props as { onMouseEnter?: (ev: React.MouseEvent) => void }).onMouseEnter?.(e);
        show();
      },
      onMouseLeave: (e: React.MouseEvent) => {
        (children.props as { onMouseLeave?: (ev: React.MouseEvent) => void }).onMouseLeave?.(e);
        hide();
      },
      onFocus: (e: React.FocusEvent) => {
        (children.props as { onFocus?: (ev: React.FocusEvent) => void }).onFocus?.(e);
        show();
      },
      onBlur: (e: React.FocusEvent) => {
        (children.props as { onBlur?: (ev: React.FocusEvent) => void }).onBlur?.(e);
        hide();
      },
    });
  }, [children, hide, show, open, tooltipId]);

  const panelClass = [
    styles.Panel,
    compact ? styles["Panel--compact"] : styles["Panel--expanded"],
    placement === "top" && styles["Panel--top"],
    placement === "bottom" && styles["Panel--bottom"],
    placement === "left" && styles["Panel--left"],
    placement === "right" && styles["Panel--right"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={[styles.Root, className].filter(Boolean).join(" ")}>
      {trigger}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={panelClass}
        >
          {content}
        </span>
      )}
    </span>
  );
}
