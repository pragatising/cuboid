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
import styles from "./Popover.module.css";

export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

/** Figma `ActionMenu.Overlay` elevation variants — `3x` is the default dropdown shell. */
export type PopoverElevation = "3x" | "4x";

export type PopoverPanelRole = "dialog" | false;

export interface PopoverProps {
  /** When omitted, open state is managed internally (toggle on trigger click). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Anchor control — positioned relative to Popover’s wrapper, not the child ref. */
  trigger: React.ReactElement;
  /** Panel content — menus, forms, or any interactive UI. */
  children: React.ReactNode;
  placement?: PopoverPlacement;
  elevation?: PopoverElevation;
  /** Close on outside pointer down and Escape. Default true. */
  dismissible?: boolean;
  /**
   * Panel ARIA role. Use `false` for positioning shells whose semantics live on
   * children (e.g. `ActionMenuList` with `role="menu"`).
   * @default "dialog"
   */
  panelRole?: PopoverPanelRole;
  /** @default "dialog" */
  triggerHasPopup?: "dialog" | "menu" | "listbox" | "grid" | "tree" | boolean;
  panelRef?: React.Ref<HTMLDivElement>;
  onPanelKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  /** Return focus to the trigger after the panel closes. */
  returnFocusOnClose?: boolean;
  /** Accessible name for the panel when content has no visible title. */
  "aria-label"?: string;
  /** id of an element that labels the panel. */
  "aria-labelledby"?: string;
  theme?: CubeTheme;
  className?: string;
  contentClassName?: string;
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
  placement: PopoverPlacement,
  gapPx: number
): React.CSSProperties {
  switch (placement) {
    case "bottom-start":
      return { top: rect.bottom + gapPx, left: rect.left };
    case "bottom-end":
      return {
        top: rect.bottom + gapPx,
        left: rect.right,
        transform: "translateX(-100%)",
      };
    case "bottom":
      return {
        top: rect.bottom + gapPx,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "top-start":
      return {
        top: rect.top - gapPx,
        left: rect.left,
        transform: "translateY(-100%)",
      };
    case "top-end":
      return {
        top: rect.top - gapPx,
        left: rect.right,
        transform: "translate(-100%, -100%)",
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

function popoverCssVars(tokens: ThemeTokens, elevation: PopoverElevation): Record<string, string> {
  const { popover } = tokens.colors.functional;
  const layout = tokens.sizes.popover;
  const shadow =
    elevation === "4x" ? tokens.shadows.popoverElevated : tokens.shadows.popover;

  return {
    "--cube-popover-bg": popover.background,
    "--cube-popover-gap": layout.gap,
    "--cube-popover-borderRadius": layout.borderRadius,
    "--cube-popover-minWidth": layout.minWidth,
    "--cube-popover-maxWidth": layout.maxWidth,
    "--cube-popover-shadow": shadow,
    "--cube-z-index-popover": tokens.sizes.zIndex.popover,
  };
}

/**
 * Portaled, anchored floating panel — maps to Figma `ActionMenu.Overlay`.
 *
 * Not a viewport scrim (`Overlay`) and not a passive label (`Tooltip`).
 * Use for dropdown menus, pickers, and other interactive floating content.
 */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function focusableDescendant(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  return (
    root.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? null
  );
}

export function Popover({
  open: openProp,
  onOpenChange,
  trigger,
  children,
  placement = "bottom-start",
  elevation = "3x",
  dismissible = true,
  panelRole = "dialog",
  triggerHasPopup = "dialog",
  panelRef: panelRefProp,
  onPanelKeyDown,
  returnFocusOnClose = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  theme,
  className,
  contentClassName,
}: PopoverProps) {
  const tokens = useTheme(theme);
  const panelId = useId();
  /** Wrapper around the trigger — always a DOM node for anchoring. */
  const anchorRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (wasOpenRef.current && !open && returnFocusOnClose) {
      (triggerRef.current ?? focusableDescendant(anchorRef.current))?.focus();
    }
    wasOpenRef.current = open;
  }, [open, returnFocusOnClose]);

  const gapPx = useMemo(
    () => parseLengthPx(tokens.sizes.popover.gap),
    [tokens.sizes.popover.gap]
  );

  const inlineVars = theme
    ? (popoverCssVars(tokens, elevation) as React.CSSProperties)
    : undefined;

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
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
    if (!open || !dismissible) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dismissible, open, setOpen]);

  const setTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (trigger as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [trigger]
  );

  const onTriggerClick = useCallback(
    (event: React.MouseEvent) => {
      (trigger.props as { onClick?: (ev: React.MouseEvent) => void }).onClick?.(event);
      if (event.defaultPrevented) return;
      setOpen(!open);
    },
    [open, setOpen, trigger]
  );

  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
    },
    []
  );

  const triggerElement = useMemo(() => {
    return React.cloneElement(
      trigger as React.ReactElement<Record<string, unknown>>,
      {
      ref: setTriggerRef,
      type:
        (trigger.props as { type?: string }).type ??
        (trigger.type === "button" ? "button" : undefined),
      "aria-expanded": open,
      "aria-haspopup": triggerHasPopup,
      "aria-controls": open ? panelId : undefined,
      onClick: onTriggerClick,
    }
    );
  }, [open, onTriggerClick, panelId, setTriggerRef, trigger, triggerHasPopup]);

  const panelClass = [
    styles.Panel,
    styles[`Panel--elevation-${elevation}`],
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={mergeRefs(setPanelRef, panelRefProp)}
            id={panelId}
            role={panelRole === false ? undefined : panelRole}
            aria-modal={panelRole === "dialog" ? "false" : undefined}
            aria-label={panelRole === "dialog" ? ariaLabel : undefined}
            aria-labelledby={panelRole === "dialog" ? ariaLabelledBy : undefined}
            className={panelClass}
            style={{ ...fixedStyle, ...(inlineVars ?? {}) }}
            onKeyDown={onPanelKeyDown}
          >
            {children}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={[styles.Root, className].filter(Boolean).join(" ")}
      >
        {triggerElement}
      </span>
      {panel}
    </>
  );
}
