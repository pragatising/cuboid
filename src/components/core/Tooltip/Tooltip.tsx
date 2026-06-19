import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, ThemeTokens } from "../../../theme/types";
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

function parseLengthPx(value: string, fallback = 4): number {
  if (typeof value !== "string") return fallback;
  if (value.endsWith("rem")) return parseFloat(value) * 16;
  if (value.endsWith("px")) return parseFloat(value);
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeFixedPosition(
  rect: DOMRect,
  placement: TooltipPlacement,
  gapPx: number
): React.CSSProperties {
  switch (placement) {
    case "bottom":
      return {
        top: rect.bottom + gapPx,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "top":
      return {
        top: rect.top - gapPx,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gapPx,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + gapPx,
        transform: "translateY(-50%)",
      };
  }
}

function tooltipCssVars(tokens: ThemeTokens): Record<string, string> {
  const { functional } = tokens.colors;
  const tip = functional.tooltip;
  const layout = tokens.sizes.tooltip;
  const caption = tokens.typography.text.caption;
  return {
    "--cube-tooltip-bg": tip.background,
    "--cube-tooltip-border": tip.border,
    "--cube-tooltip-fg": tip.foreground,
    "--cube-tooltip-gap": layout.gap,
    "--cube-tooltip-borderRadius": layout.borderRadius,
    "--cube-tooltip-paddingInline": layout.paddingInline,
    "--cube-tooltip-paddingBlock": layout.paddingBlock,
    "--cube-tooltip-maxWidth": layout.maxWidth,
    "--cube-tooltip-maxWidthSingleLine": layout.maxWidthSingleLine,
    "--cube-tooltip-shadow": layout.boxShadow,
    "--cube-z-index-tooltip": tokens.sizes.zIndex.tooltip,
    "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
    "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
    "--cube-typography-text-caption-fontSize": caption.fontSize,
    "--cube-typography-text-caption-fontWeight": String(caption.fontWeight),
    "--cube-typography-text-caption-lineHeight": String(caption.lineHeight),
  };
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
  const tokens = useTheme(theme);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gapPx = useMemo(
    () => parseLengthPx(tokens.sizes.tooltip.gap),
    [tokens.sizes.tooltip.gap]
  );

  const inlineVars = theme ? (tooltipCssVars(tokens) as React.CSSProperties) : undefined;

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

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setFixedStyle(computeFixedPosition(el.getBoundingClientRect(), placement, gapPx));
  }, [gapPx, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hide]);

  const setTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [children]
  );

  const trigger = useMemo(() => {
    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      {
      ref: setTriggerRef,
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
    }
    );
  }, [children, hide, show, open, tooltipId, setTriggerRef]);

  const panelClass = [
    styles.Panel,
    styles["Panel--fixed"],
    compact ? styles["Panel--compact"] : styles["Panel--expanded"],
  ]
    .filter(Boolean)
    .join(" ");

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className={panelClass}
            style={{ ...fixedStyle, ...(inlineVars ?? {}) }}
          >
            {content}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span className={[styles.Root, className].filter(Boolean).join(" ")}>{trigger}</span>
      {panel}
    </>
  );
}
