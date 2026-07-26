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
import type { CubeTheme, StackPadding, ThemeTokens } from "../../../theme/types";
import { CloseIcon } from "../../../icons/material";
import { parseLengthPx } from "../../../utils/parseLengthPx";
import { ActionMenuList } from "../ActionMenu/ActionMenuList";
import { Button, type ButtonVariant } from "../Button";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Text } from "../Text";
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

/** One button in a `footer` action row — Figma `ActionMenuFooter` `Button` slot. */
export interface PopoverAction {
  label: React.ReactNode;
  onClick?: () => void;
  /** @default "primary" for `primary`, "secondary" for `secondary` */
  variant?: ButtonVariant;
  disabled?: boolean;
}

/**
 * Built-in two-button footer row — Figma `ActionMenuFooter`. Pass a plain
 * `ReactNode` to `footer` instead for any other layout (single action,
 * filter-count row, etc.).
 */
export interface PopoverFooterActions {
  primary?: PopoverAction;
  secondary?: PopoverAction;
  /**
   * `"justified"` — secondary left, primary right, space-between (Figma
   * `alignment="justfied"`; matches `ActionMenu`'s own Reset/Done footer).
   * `"left"` — primary left, secondary right, small gap, left-aligned
   * (Figma `alignment="left"`).
   * @default "justified"
   */
  align?: "justified" | "left";
}

function isFooterActions(
  footer: React.ReactNode | PopoverFooterActions,
): footer is PopoverFooterActions {
  return (
    typeof footer === "object" &&
    footer !== null &&
    !Array.isArray(footer) &&
    !React.isValidElement(footer) &&
    ("primary" in footer || "secondary" in footer || "align" in footer)
  );
}

function renderFooterAction(action: PopoverAction | undefined, fallbackVariant: ButtonVariant) {
  if (!action) return null;
  return (
    <Button
      variant={action.variant ?? fallbackVariant}
      size="xs"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

function renderFooterActions(actions: PopoverFooterActions): React.ReactNode {
  const primaryButton = renderFooterAction(actions.primary, "primary");
  const secondaryButton = renderFooterAction(actions.secondary, "secondary");

  if (actions.align === "left") {
    return (
      <Stack direction="horizontal" gap="sm" width="full">
        {primaryButton}
        {secondaryButton}
      </Stack>
    );
  }

  return (
    <Stack direction="horizontal" justify="space-between" width="full">
      {secondaryButton}
      {primaryButton}
    </Stack>
  );
}

export interface PopoverProps {
  /** When omitted, open state is managed internally (toggle on trigger click). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Anchor control — positioned relative to Popover’s wrapper, not the child ref. */
  trigger: React.ReactElement;
  /** Panel body — menus, forms, or any interactive UI. */
  children: React.ReactNode;
  /**
   * Header slot, rendered above the body with the same chrome as
   * `ActionMenuList.Header` (divider below). A string/number renders the
   * standard title row (+ close button via `onClose`); pass any other
   * `ReactNode` for full customization — it's rendered as-is, uncontained.
   */
  header?: React.ReactNode;
  /** Close handler for the built-in header's close button. No-op when `header` isn't a string. */
  onClose?: () => void;
  /**
   * Footer slot, rendered below the body with the same chrome as
   * `ActionMenuList.Footer` (border-top above). Pass `{ primary, secondary,
   * align }` for the built-in two-button row (see {@link PopoverFooterActions}),
   * or any `ReactNode` for full customization.
   */
  footer?: React.ReactNode | PopoverFooterActions;
  /**
   * Padding around `children` when `header` and/or `footer` are set — the
   * slot system implies the body content needs be inset. Ignored (no
   * wrapping) when neither `header` nor `footer` is provided, so plain
   * `Popover` usage (e.g. `ActionMenu`) is unaffected.
   * @default "md"
   */
  bodyPadding?: StackPadding;
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
  header,
  onClose,
  footer,
  bodyPadding = "md",
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
  const headerTitleId = useId();
  const hasSlots = header !== undefined || footer !== undefined;
  const isStringHeader = typeof header === "string" || typeof header === "number";
  const resolvedAriaLabelledBy = ariaLabelledBy ?? (isStringHeader ? headerTitleId : undefined);
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
    () => parseLengthPx(tokens.sizes.popover.gap, 4),
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
      const childRef = (
        trigger.props as React.RefAttributes<HTMLElement>
      ).ref;
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

  const renderedHeader =
    header === undefined ? null : (
      <ActionMenuList.Header>
        {isStringHeader ? (
          <Stack direction="horizontal" align="center" gap="sm" width="full">
            <Stack id={headerTitleId} grow width="full">
              <Text role="body" size="sm" weight="semibold" color="text.contrast">
                {header}
              </Text>
            </Stack>
            {onClose ? (
              <IconButton
                aria-label="Close"
                tooltip="Close"
                variant="ghost"
                size="xs"
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            ) : null}
          </Stack>
        ) : (
          header
        )}
      </ActionMenuList.Header>
    );

  const renderedFooter =
    footer === undefined ? null : (
      <ActionMenuList.Footer>
        {isFooterActions(footer) ? renderFooterActions(footer) : footer}
      </ActionMenuList.Footer>
    );

  const bodyPaddingVar = `var(--cube-stack-padding-${bodyPadding})`;

  const panelContent = hasSlots ? (
    <>
      {renderedHeader}
      <Stack
        gap="sm"
        align="stretch"
        paddingInline={bodyPadding}
        width="full"
        style={{
          // ActionMenuList.Header's own padding-block-end sits *after* its
          // divider, so it already supplies the gap down to the body — a
          // symmetric `padding` here would double it. ActionMenuList.Footer
          // is the opposite: `border-top` sits flush at its own top edge and
          // its padding only pushes content *below* the line, so the gap
          // above the footer must still come from the body itself.
          paddingBlockStart: header === undefined ? bodyPaddingVar : 0,
          paddingBlockEnd: bodyPaddingVar,
        }}
      >
        {children}
      </Stack>
      {renderedFooter}
    </>
  ) : (
    children
  );

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={mergeRefs(setPanelRef, panelRefProp)}
            id={panelId}
            role={panelRole === false ? undefined : panelRole}
            aria-modal={panelRole === "dialog" ? "false" : undefined}
            aria-label={panelRole === "dialog" ? ariaLabel : undefined}
            aria-labelledby={panelRole === "dialog" ? resolvedAriaLabelledBy : undefined}
            className={panelClass}
            style={{ ...fixedStyle, ...(inlineVars ?? {}) }}
            onKeyDown={onPanelKeyDown}
          >
            {panelContent}
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
