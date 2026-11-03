import React from "react";
import { clsx } from "clsx";
import { announce } from "../../../utils/announce";
import { isDev } from "../../../utils/isDev";
import { mergeProps } from "../../../utils/mergeProps";
import { Spinner } from "../Button/Spinner";
import { Tooltip, useTooltipContext } from "../Tooltip";
import type { TooltipPlacement } from "../Tooltip";
import classes from "./IconButton.module.css";

// The variants and sizes are the keys of the iconButton tokens. IconButton.test-d.tsx fails if these drift from them.
export type IconButtonVariant = "ghost" | "outlined";
export type IconButtonSize = "sm" | "md" | "lg";

/** A button with no visible text needs an accessible name: exactly one of `aria-label` or `aria-labelledby`. */
export type IconButtonA11yProps =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-label"?: undefined; "aria-labelledby": string };

export type IconButtonProps = IconButtonA11yProps & {
  /** The icon to show. It is hidden from assistive technology: the accessible name comes from `aria-label`. */
  icon: React.ReactNode;
  /**
   * Which `tokens.iconButton` look to use.
   * @default "outlined"
   */
  variant?: IconButtonVariant;
  /**
   * The button's square size, the icon size and the radius.
   * @default "sm"
   */
  size?: IconButtonSize;
  /** A toggle's pressed state: draws the selected look and sets `aria-pressed`. Leave unset for a plain action. */
  selected?: boolean;
  /**
   * Disables the button. Avoid it where you can: a natively disabled button cannot be focused. With a
   * tooltip (the default), the button becomes `inactive` instead, so the tooltip can still explain why.
   */
  disabled?: boolean;
  /** Looks disabled but stays focusable and announced; activation is ignored. */
  inactive?: boolean;
  /** A spinner replaces the icon and activation is ignored. The button stays focusable. */
  loading?: boolean;
  /**
   * What to announce to screen readers when loading starts.
   * @default "Loading"
   */
  loadingMessage?: string;
  /**
   * Supplementary text for a tooltip, announced as the button's description. The button keeps its `aria-label`. Without it
   * the `aria-label` itself is shown as a label tooltip, which is then the button's accessible name.
   */
  description?: string;
  /** A keyboard shortcut shown in the tooltip (`"Mod+K"`), as `KeybindingHint` takes `keys`. */
  keybindingHint?: string | readonly string[];
  /** Show no tooltip, for a button inside something that already explains it. @default false */
  disableTooltip?: boolean;
  /** Which side of the button the tooltip appears on. @default "bottom" */
  tooltipPlacement?: TooltipPlacement;
} & Omit<React.ComponentPropsWithRef<"button">, "aria-label" | "aria-labelledby" | "children">;

const isTrue = (value: unknown) => value === true || value === "true";

/**
 * A button that shows only an icon. Colours come from `tokens.iconButton`; the state colours (hover, pressed,
 * disabled) reach the CSS as element-scoped variables because a pseudo-class cannot be an inline style. The
 * `aria-label` is shown as a label `Tooltip` (not inside another tooltip, not while the button's own menu is open).
 */
export function IconButton({
  icon,
  variant = "outlined",
  size = "sm",
  selected,
  disabled,
  inactive,
  loading,
  loadingMessage = "Loading",
  description,
  keybindingHint,
  disableTooltip,
  tooltipPlacement = "bottom",
  className,
  ...props
}: IconButtonProps) {
  const { tooltipId: enclosingTooltip } = useTooltipContext();
  const ariaLabel = props["aria-label"];
  const tooltipText = description ?? ariaLabel;
  const tooltipType = description ? "description" : "label";
  const hasTooltip = !disableTooltip && !enclosingTooltip && Boolean(tooltipText);
  // The tooltip would sit on top of what the button opened (a menu, a popover).
  const menuOpen = isTrue(props["aria-expanded"]);
  // A label tooltip is the accessible name; an aria-label as well would name the button twice.
  const { "aria-label": _name, ...labelless } = props;
  const buttonProps = hasTooltip && tooltipType === "label" ? labelless : props;

  // A natively disabled button gets no hover or focus, so no tooltip: with one, `disabled` becomes `inactive`,
  // which keeps both and still ignores activation. Loading and a consumer's own aria-disabled act the same way.
  const lookInactive = Boolean(inactive || (hasTooltip && disabled) || isTrue(props["aria-disabled"]));
  const ariaDisabled = lookInactive || Boolean(loading);

  React.useEffect(() => {
    if (loading) announce(loadingMessage);
  }, [loading, loadingMessage]);

  React.useEffect(() => {
    if (isDev() && !props["aria-label"] && !props["aria-labelledby"]) {
      console.warn("An icon-only button needs an accessible name: pass `aria-label` or `aria-labelledby`.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a development check of the props at mount
  }, []);

  const button = (
    <button
      {...mergeProps(
        {
          "data-component": "IconButton",
          "data-variant": variant,
          "data-size": size,
          "data-selected": selected ? "" : undefined,
          "data-loading": loading ? "" : undefined,
          "data-inactive": lookInactive ? "" : undefined,
          type: "button" as const,
          disabled: hasTooltip ? undefined : disabled,
          ...(ariaDisabled ? { "aria-disabled": true } : {}),
          ...(selected !== undefined ? { "aria-pressed": selected } : {}),
          className: clsx(classes.IconButton, className),
          // The component's handler runs first; the consumer's is skipped when the event is default-prevented (mergeProps).
          onClick: (event: React.SyntheticEvent) => {
            if (ariaDisabled) event.preventDefault();
          },
        },
        buttonProps,
      )}
    >
      <span data-component="icon" className={classes.Icon} aria-hidden="true">
        {loading ? <Spinner /> : icon}
      </span>
    </button>
  );

  if (!hasTooltip) return button;

  return (
    <Tooltip
      text={tooltipText as string}
      type={tooltipType}
      placement={tooltipPlacement}
      keybindingHint={keybindingHint}
      suppress={menuOpen}
    >
      {button}
    </Tooltip>
  );
}
