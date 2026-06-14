import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Popover } from "../Popover";
import type { PopoverElevation, PopoverPlacement } from "../Popover";
import type { CubeTheme } from "../../../theme/types";
import { ActionMenuList } from "./ActionMenuList";
import {
  focusInitialMenuItem,
  getEnabledMenuItems,
  handleMenuListKeyDown,
} from "./actionMenuKeyboard";

export interface ActionMenuProps {
  /** Anchor control — `Button`, `IconButton`, etc. */
  trigger: React.ReactElement;
  /** Menu rows and optional `ActionMenuList.*` regions. */
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  elevation?: PopoverElevation;
  /** Close after a menu item is activated. @default true */
  closeOnSelect?: boolean;
  /** Accessible name when the menu has no visible title. */
  "aria-label"?: string;
  /** id of an element that labels the menu. */
  "aria-labelledby"?: string;
  theme?: CubeTheme;
  className?: string;
  listClassName?: string;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function isActionMenuListElement(child: React.ReactNode): child is React.ReactElement {
  return React.isValidElement(child) && child.type === ActionMenuList;
}

/**
 * Composed dropdown menu — Figma `ActionMenu`.
 *
 * Wires trigger + `Popover` + `ActionMenuList` with menu keyboard support.
 */
export function ActionMenu({
  trigger,
  children,
  open: openProp,
  onOpenChange,
  placement = "bottom-start",
  elevation = "3x",
  closeOnSelect = true,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  theme,
  className,
  listClassName,
}: ActionMenuProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  useLayoutEffect(() => {
    if (!open) return;
    focusInitialMenuItem(listRef.current);
  }, [open]);

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleMenuListKeyDown(event, listRef.current);
      if (event.key === "Tab") {
        setOpen(false);
      }
    },
    [setOpen]
  );

  const handleListClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!closeOnSelect) return;
      const target = event.target as HTMLElement;
      const item = target.closest('[role="menuitem"]') as HTMLButtonElement | null;
      if (!item || item.disabled || item.getAttribute("aria-disabled") === "true") return;
      if (item.dataset.keepOpen === "true") return;
      setOpen(false);
    },
    [closeOnSelect, setOpen]
  );

  const menuTrigger = useMemo(() => {
    return React.cloneElement(trigger, {
      onKeyDown: (event: React.KeyboardEvent) => {
        (trigger.props as { onKeyDown?: (ev: React.KeyboardEvent) => void }).onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (!open && event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
        }
      },
    });
  }, [open, setOpen, trigger]);

  const listProps = {
    ref: listRef,
    theme,
    className: listClassName,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    onKeyDown: handleListKeyDown,
    onClick: handleListClick,
  } satisfies Partial<React.ComponentProps<typeof ActionMenuList>>;

  const menuContent = isActionMenuListElement(children)
    ? React.cloneElement(children, {
        ref: mergeRefs(listRef, (children as React.ReactElement & { ref?: React.Ref<HTMLDivElement> }).ref),
        theme: theme ?? children.props.theme,
        className: [listClassName, children.props.className].filter(Boolean).join(" ") || undefined,
        "aria-label": ariaLabel ?? children.props["aria-label"],
        "aria-labelledby": ariaLabelledBy ?? children.props["aria-labelledby"],
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          children.props.onKeyDown?.(event);
          if (!event.defaultPrevented) handleListKeyDown(event);
        },
        onClick: (event: React.MouseEvent<HTMLDivElement>) => {
          children.props.onClick?.(event);
          if (!event.defaultPrevented) handleListClick(event);
        },
      })
    : (
        <ActionMenuList {...listProps}>{children}</ActionMenuList>
      );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={menuTrigger}
      placement={placement}
      elevation={elevation}
      panelRole={false}
      triggerHasPopup="menu"
      returnFocusOnClose
      theme={theme}
      className={className}
    >
      {menuContent}
    </Popover>
  );
}
