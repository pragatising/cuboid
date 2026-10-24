import React, { Children, cloneElement, isValidElement, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useProvidedRefOrCreate } from "../../../behaviors";
import type { AnchorPlacement } from "../../../behaviors";
import { useTokens } from "../../../mode";
import type { CssColor } from "../../../utils/colorPaths";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { Length, RawLength } from "../../../utils/space";
import { Box } from "../Box";
import { Button } from "../Button";
import type { ButtonProps } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { PopoverContext, usePopoverContext } from "./PopoverContext";
import { usePopover } from "./usePopover";
import classes from "./Popover.module.css";

export type PopoverPlacement = AnchorPlacement;

/** The shadow of the panel: `3x` is the default dropdown shell. */
export type PopoverElevation = "3x" | "4x";

/** What the panel is, when it is something specific: a `dialog`, a `menu`, a `listbox`… Without one it is a plain region. */
export type PopoverRole = "dialog" | "menu" | "listbox" | "tree" | "grid";

type ButtonVariant = NonNullable<ButtonProps["variant"]>;

/** One button of a `Popover.Footer` action row. */
export type PopoverAction = {
  label: React.ReactNode;
  onClick?: () => void;
  /** @default "primary" for `primary`, "secondary" for `secondary` */
  variant?: ButtonVariant;
  disabled?: boolean;
};

export type PopoverProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "color" | "content"> & {
  /** The control that opens it. Needs to take a `ref` and an `onClick`: a `Button` or `IconButton`. */
  trigger: React.ReactElement;
  /** `Popover.Header`, `Popover.Body` and `Popover.Footer`, or anything else: it is the panel's content. */
  children: React.ReactNode;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default "bottom-start" */
  placement?: PopoverPlacement;
  /** @default "3x" */
  elevation?: PopoverElevation;
  /** Close on Escape and on a press outside it. @default true */
  dismissible?: boolean;
  /**
   * What the panel is. A popover is a generic non-modal overlay, so it has no role unless you say: `dialog` for a form or a
   * panel of controls (then it needs a name), `menu` / `listbox` for the composite widgets built on it.
   */
  role?: PopoverRole;
  /** What the trigger says it opens (`aria-haspopup`). Defaults to the `role`, and is left off without one. */
  triggerHasPopup?: PopoverRole | boolean;
  /** Move focus into the panel when it opens. Turn off for a trigger that must keep it, such as a combobox. @default true */
  autoFocus?: boolean;
  /** Give focus back to the trigger when it closes. @default true */
  returnFocusOnClose?: boolean;
  /** Caps the panel's height (any CSS length). The content scrolls inside it; the header and footer stay put. */
  maxHeight?: Length;
  /**
   * Position the panel against this element instead of the trigger, and render the trigger as it is: it is not cloned, so it
   * gets no toggle on click and no `aria-expanded`, `aria-controls` or `aria-haspopup`. For a combobox, whose input drives
   * `open` itself and whose anchor is the field's box (not the label and help text around it).
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Make the panel at least as wide as what it is anchored to. @default false */
  matchAnchorWidth?: boolean;
};

function isPart(child: React.ReactNode, part: unknown): child is React.ReactElement<Record<string, unknown>> {
  return isValidElement(child) && child.type === part;
}

/**
 * An anchored, non-modal floating panel: dropdowns, pickers, small forms. Not a scrim over the page (`Overlay`, `Sheet`), not a
 * passive hint (`Tooltip`).
 *
 * There is no wrapper element: the popover clones its trigger to add the open state and a ref, and renders the panel in a
 * portal. Compose the panel from `Popover.Header` (a title, optionally a close button), `Popover.Body` and `Popover.Footer`.
 */
function PopoverRoot({
  trigger,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  placement = "bottom-start",
  elevation = "3x",
  dismissible = true,
  role,
  triggerHasPopup,
  autoFocus = true,
  returnFocusOnClose = true,
  maxHeight,
  anchorRef,
  matchAnchorWidth = false,
  className,
  ref,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: PopoverProps) {
  const { popover, shadow, zIndex, focusRing } = useTokens();
  const titleId = React.useId();
  const triggerRef = useProvidedRefOrCreate<HTMLElement>(anchorRef ?? (trigger.props as { ref?: React.Ref<HTMLElement> }).ref);
  const panelRef = useProvidedRefOrCreate<HTMLDivElement>(ref);

  const { open, panelId, style, toggle } = usePopover({
    open: openProp,
    defaultOpen,
    onOpenChange,
    placement,
    // Anchored to a field (a combobox), the field's focus ring is wider than the usual gap: clear it.
    gap: lengthToPx(popover.sizes.gap, 4) + (anchorRef ? lengthToPx(focusRing.width, 3) + lengthToPx(focusRing.offset, 2) : 0),
    dismissible,
    returnFocus: returnFocusOnClose,
    autoFocus,
    triggerRef,
    panelRef,
  });

  const [anchorWidth, setAnchorWidth] = useState<number | undefined>();
  useLayoutEffect(() => {
    if (matchAnchorWidth && open) setAnchorWidth(triggerRef.current?.getBoundingClientRect().width);
  }, [matchAnchorWidth, open, triggerRef]);

  const parts = Children.toArray(children);
  const header = parts.find((child) => isPart(child, PopoverHeader));
  const footer = parts.find((child) => isPart(child, PopoverFooter));
  const body = parts.filter((child) => !isPart(child, PopoverHeader) && !isPart(child, PopoverFooter));
  const titled = isPart(header, PopoverHeader) && ["string", "number"].includes(typeof (header.props as { children?: unknown }).children);
  const context = useMemo(() => ({ titleId, hasHeader: header !== undefined }), [titleId, header]);

  const hasPopup = triggerHasPopup ?? role ?? false;
  const triggerProps = trigger.props as { onClick?: (event: React.MouseEvent) => void; type?: string };
  const onTriggerClick = useCallback(
    (event: React.MouseEvent) => {
      triggerProps.onClick?.(event);
      if (!event.defaultPrevented) toggle();
    },
    [triggerProps.onClick, toggle],
  );

  const triggerElement = anchorRef
    ? trigger
    : cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        ref: triggerRef,
        type: triggerProps.type ?? (trigger.type === "button" ? "button" : undefined),
        "aria-expanded": open,
        ...(hasPopup ? { "aria-haspopup": hasPopup } : {}),
        "aria-controls": open ? panelId : undefined,
        onClick: onTriggerClick,
      });

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <PopoverContext.Provider value={context}>
            <Box
              {...mergeProps(
                {
                  "data-component": "Popover",
                  "data-placement": placement,
                  id: panelId,
                  role,
                  "aria-labelledby": ariaLabelledBy ?? (role === "dialog" && titled ? titleId : undefined),
                  // Focusable by script, so focus has somewhere to go when the panel holds nothing tabbable.
                  tabIndex: -1,
                  className: clsx(classes.Popover, className),
                  style,
                },
                props as object,
              )}
              ref={panelRef}
              position="fixed"
              zIndex={zIndex.popover}
              display="flex"
              flexDirection="column"
              overflow="hidden"
              boxSizing="border-box"
              margin={0}
              minWidth={matchAnchorWidth && anchorWidth !== undefined ? (`${anchorWidth}px` as Length) : resolved<Length>(popover.sizes.minWidth)}
              maxWidth={resolved<Length>(popover.sizes.maxWidth)}
              maxHeight={maxHeight}
              backgroundColor={resolved<CssColor>(popover.color.background)}
              borderRadius={resolved<RawLength>(popover.sizes.borderRadius)}
              boxShadow={shadow.floating[elevation === "4x" ? "lg" : "md"]}
              outline="none"
            >
              {header}
              <Box data-component="Popover.Content" minHeight="0" overflowY="auto" alignItems="stretch">
                {body}
              </Box>
              {footer}
            </Box>
          </PopoverContext.Provider>,
          document.body,
        )
      : null;

  return (
    <>
      {triggerElement}
      {panel}
    </>
  );
}

export type PopoverHeaderProps = Omit<React.ComponentPropsWithRef<"div">, "title"> & {
  /** A string is the popover's title (it names a `dialog`); anything else is rendered as it is. */
  children?: React.ReactNode;
  /** Shows a close button that calls this. */
  onClose?: () => void;
  /** @default "Close" */
  closeLabel?: string;
};

/** The popover's top row: a title or any content, an optional close button, and a divider below. */
function PopoverHeader({ children, onClose, closeLabel = "Close", className, ...props }: PopoverHeaderProps) {
  const { titleId } = usePopoverContext();
  const title = typeof children === "string" || typeof children === "number";

  return (
    <div {...mergeProps({ "data-component": "Popover.Header", "data-dismissible": onClose ? "" : undefined, className: clsx(classes.Header, className) }, props)}>
      <Box flexDirection="row" alignItems="center" gap="sm" width="100%">
        <Box id={title ? titleId : undefined} flexGrow={1} minWidth="0">
          {title ? (
            <Text weight="semibold" color="neutral.default">
              {children}
            </Text>
          ) : (
            children
          )}
        </Box>
        {onClose ? <IconButton aria-label={closeLabel} variant="ghost" size="sm" onClick={onClose} icon={<Icon name="close" />} /> : null}
      </Box>
      <div className={classes.HeaderDivider} role="separator" />
    </div>
  );
}

export type PopoverBodyProps = React.ComponentProps<typeof Box>;

/** The padded content area. Without one, children sit flush against the panel's edges (a menu list does). */
function PopoverBody(props: PopoverBodyProps) {
  const { hasHeader } = usePopoverContext();
  return (
    <Box
      data-component="Popover.Body"
      gap="sm"
      alignItems="stretch"
      paddingInline="md"
      // The header's own bottom padding already sits below its divider.
      paddingBlockStart={hasHeader ? 0 : "md"}
      paddingBlockEnd="md"
      width="100%"
      {...props}
    />
  );
}

export type PopoverFooterProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** The built-in action row: the main action, on the right. */
  primary?: PopoverAction;
  /** The built-in action row: the secondary action, on the left. */
  secondary?: PopoverAction;
  /** `justified`: secondary left, primary right. `left`: primary then secondary, left-aligned. @default "justified" */
  align?: "justified" | "left";
  /** Any other footer content. Used instead of `primary` and `secondary`. */
  children?: React.ReactNode;
};

const footerButton = (action: PopoverAction | undefined, fallback: ButtonVariant) =>
  action ? (
    <Button variant={action.variant ?? fallback} size="sm" onClick={action.onClick} disabled={action.disabled}>
      {action.label}
    </Button>
  ) : null;

/** The popover's bottom row: your content, or an action row from `primary` and `secondary`. */
function PopoverFooter({ primary, secondary, align = "justified", children, className, ...props }: PopoverFooterProps) {
  return (
    <div {...mergeProps({ "data-component": "Popover.Footer", className: clsx(classes.Footer, className) }, props)}>
      {children ?? (
        <Box flexDirection="row" justifyContent={align === "left" ? "flex-start" : "space-between"} gap="sm" width="100%">
          {align === "left" ? footerButton(primary, "primary") : footerButton(secondary, "secondary")}
          {align === "left" ? footerButton(secondary, "secondary") : footerButton(primary, "primary")}
        </Box>
      )}
    </div>
  );
}

export const Popover = Object.assign(PopoverRoot, { Header: PopoverHeader, Body: PopoverBody, Footer: PopoverFooter });
