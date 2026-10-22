import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { announce } from "../../../utils/announce";
import { cssVars } from "../../../utils/cssVars";
import { isDev } from "../../../utils/isDev";
import { mergeProps } from "../../../utils/mergeProps";
import { transitionCss } from "../../../utils/motion";
import { Spinner } from "../Button/Spinner";
import { Tooltip } from "../Tooltip";
import type { TooltipPlacement } from "../Tooltip";
import classes from "./IconButton.module.css";

// The variants and sizes are the keys of the iconButton tokens. IconButton.test-d.tsx fails if these drift from them.
export type IconButtonVariant = "ghost" | "outlined";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

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
   * @default "xs"
   */
  size?: IconButtonSize;
  /** A toggle's pressed state: draws the selected look and sets `aria-pressed`. Leave unset for a plain action. */
  selected?: boolean;
  /**
   * Disables the button. Avoid it where you can: a natively disabled button cannot be focused. With `tooltip`
   * as well, the button becomes `inactive` instead, so the tooltip can still explain why.
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
   * A hover/focus hint. The button still needs its accessible name; the tooltip is wired with `aria-describedby`
   * while open.
   */
  tooltip?: React.ReactNode;
  /** Which side of the button the tooltip appears on. @default "bottom" */
  tooltipPlacement?: TooltipPlacement;
} & Omit<React.ComponentPropsWithRef<"button">, "aria-label" | "aria-labelledby" | "children">;

const isTrue = (value: unknown) => value === true || value === "true";

/**
 * Token values as inline styles: the colours of every state (as the `--icon-button-<property>-<state>` variables
 * the CSS reads), the focus ring, and the square geometry. Pure: tokens and options in, style out.
 */
export function resolveIconButtonStyle(
  tokens: Tokens,
  { variant, size, selected }: { variant: IconButtonVariant; size: IconButtonSize; selected: boolean },
): React.CSSProperties {
  const colors = tokens.iconButton[variant][selected ? "selected" : "default"];
  const square = tokens.iconButton[size];

  return {
    ...cssVars("iconButton", {
      bg: colors.bgColor,
      fg: colors.fgColor,
      border: colors.borderColor,
      iconSize: square.icon,
      focusColor: tokens.focusRing.color,
      focusWidth: tokens.focusRing.width,
      focusOffset: tokens.focusRing.offset,
    }),
    width: square.size,
    height: square.size,
    borderRadius: square.borderRadius,
    borderWidth: tokens.borderWidth.thin,
    transition: transitionCss(tokens.motion.transition.hover, ["background-color", "border-color", "color"]),
  };
}

/**
 * A button that shows only an icon. Colours come from `tokens.iconButton`; the state colours (hover, pressed,
 * disabled) reach the CSS as element-scoped variables because a pseudo-class cannot be an inline style. The
 * optional `tooltip` wraps it in a `Tooltip`.
 */
export function IconButton({
  icon,
  variant = "outlined",
  size = "xs",
  selected,
  disabled,
  inactive,
  loading,
  loadingMessage = "Loading",
  tooltip,
  tooltipPlacement = "bottom",
  className,
  ...props
}: IconButtonProps) {
  const tokens = useTokens();
  const hasTooltip = tooltip != null && tooltip !== "";

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
          style: resolveIconButtonStyle(tokens, { variant, size, selected: Boolean(selected) }),
        },
        props,
      )}
    >
      <span data-component="icon" className={classes.Icon} aria-hidden="true">
        {loading ? <Spinner /> : icon}
      </span>
    </button>
  );

  if (!hasTooltip) return button;

  return (
    <Tooltip content={tooltip} placement={tooltipPlacement} compact>
      {button}
    </Tooltip>
  );
}
