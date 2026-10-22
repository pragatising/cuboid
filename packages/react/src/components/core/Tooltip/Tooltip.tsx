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
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export type TooltipProps = Omit<React.ComponentPropsWithRef<"span">, "content" | "children"> & {
  /** Tooltip content (non-interactive label) */
  content: React.ReactNode;
  /** Anchor element(s); must be a single React element that accepts event props */
  children: React.ReactElement;
  /** Which side of the anchor the tooltip appears on. @default "bottom" */
  placement?: TooltipPlacement;
  /** Single line + ellipsis + narrow max-width (Figma truncated variant). @default false */
  compact?: boolean;
  /** Milliseconds before showing after hover/focus. @default 200 */
  showDelay?: number;
};

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

export function Tooltip({
  content,
  children,
  placement = "bottom",
  compact = false,
  showDelay = 200,
  className,
  ...props
}: TooltipProps) {
  const { tooltip, text, borderWidth, zIndex } = useTokens();
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gapPx = useMemo(() => lengthToPx(tooltip.sizes.gap, 4), [tooltip.sizes.gap]);

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
      const childRef = (
        children.props as React.RefAttributes<HTMLElement>
      ).ref;
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

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            data-component="Tooltip.Panel"
            id={tooltipId}
            role="tooltip"
            className={clsx(classes.Panel, compact ? classes.Compact : classes.Expanded)}
            style={{
              ...fixedStyle,
              zIndex: zIndex.tooltip,
              font: text.size.sm,
              color: tooltip.color.foreground,
              backgroundColor: tooltip.color.background,
              borderWidth: borderWidth.thin,
              borderColor: tooltip.color.border,
              borderRadius: tooltip.sizes.borderRadius,
              paddingBlock: tooltip.sizes.paddingBlock,
              paddingInline: tooltip.sizes.paddingInline,
              boxShadow: tooltip.sizes.boxShadow,
              maxWidth: compact ? tooltip.sizes.maxWidthSingleLine : tooltip.sizes.maxWidth,
            }}
          >
            {content}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span {...mergeProps({ "data-component": "Tooltip", className: clsx(classes.Root, className) }, props)}>{trigger}</span>
      {panel}
    </>
  );
}
