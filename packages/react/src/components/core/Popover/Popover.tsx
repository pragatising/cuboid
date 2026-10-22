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
import type { Space } from "../../../utils/space";
import { ActionMenuList } from "../ActionMenu/ActionMenuList";
import { Box } from "../Box";
import { Button, type ButtonProps } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import classes from "./Popover.module.css";

type ButtonVariant = NonNullable<ButtonProps["variant"]>;

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
      <Box flexDirection="row" gap="sm" width="100%">
        {primaryButton}
        {secondaryButton}
      </Box>
    );
  }

  return (
    <Box flexDirection="row" justifyContent="space-between" width="100%">
      {secondaryButton}
      {primaryButton}
    </Box>
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
  bodyPadding?: Space;
  /**
   * Caps the panel's height (any valid CSS length, e.g. `"320px"`,
   * `"60vh"`). Content beyond it scrolls inside the panel — header/footer
   * slots stay pinned outside the scroll region. Unset means no cap (the
   * panel grows to fit its content, today's behavior).
   */
  maxHeight?: string;
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
  maxHeight,
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
  className,
  contentClassName,
}: PopoverProps) {
  const tokens = useTokens();
  const { popover, shadow, zIndex } = tokens;
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

  const gapPx = useMemo(() => lengthToPx(popover.sizes.gap, 4), [popover.sizes.gap]);

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

  const panelClass = clsx(classes.Panel, contentClassName);

  const renderedHeader =
    header === undefined ? null : (
      <ActionMenuList.Header>
        {isStringHeader ? (
          <Box flexDirection="row" alignItems="center" gap="sm" width="100%">
            <Box id={headerTitleId} flexGrow={1} width="100%">
              <Text weight="semibold" color="neutral.default">
                {header}
              </Text>
            </Box>
            {onClose ? (
              <IconButton
                aria-label="Close"
                variant="ghost"
                size="xs"
                onClick={onClose}
                icon={<Icon name="close" />}
              />
            ) : null}
          </Box>
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

  const panelContent = hasSlots ? (
    <>
      {renderedHeader}
      <Box
        gap="sm"
        alignItems="stretch"
        paddingInline={bodyPadding}
        // ActionMenuList.Header's own padding-block-end sits *after* its
        // divider, so it already supplies the gap down to the body — a
        // symmetric `padding` here would double it. ActionMenuList.Footer
        // is the opposite: `border-top` sits flush at its own top edge and
        // its padding only pushes content *below* the line, so the gap
        // above the footer must still come from the body itself.
        paddingBlockStart={header === undefined ? bodyPadding : 0}
        paddingBlockEnd={bodyPadding}
        width="100%"
        className={maxHeight ? classes.PanelScroll : undefined}
      >
        {children}
      </Box>
      {renderedFooter}
    </>
  ) : maxHeight ? (
    <div className={classes.PanelScroll}>{children}</div>
  ) : (
    children
  );

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            data-component="Popover.Panel"
            ref={mergeRefs(setPanelRef, panelRefProp)}
            id={panelId}
            role={panelRole === false ? undefined : panelRole}
            aria-modal={panelRole === "dialog" ? "false" : undefined}
            aria-label={panelRole === "dialog" ? ariaLabel : undefined}
            aria-labelledby={panelRole === "dialog" ? resolvedAriaLabelledBy : undefined}
            className={panelClass}
            style={{
              ...fixedStyle,
              zIndex: zIndex.popover,
              minWidth: popover.sizes.minWidth,
              maxWidth: popover.sizes.maxWidth,
              backgroundColor: popover.color.background,
              borderRadius: popover.sizes.borderRadius,
              boxShadow: shadow.floating[elevation === "4x" ? "lg" : "md"],
              ...(maxHeight ? { maxHeight } : {}),
            }}
            onKeyDown={onPanelKeyDown}
          >
            {panelContent}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span data-component="Popover" ref={anchorRef} className={clsx(classes.Root, className)}>
        {triggerElement}
      </span>
      {panel}
    </>
  );
}
