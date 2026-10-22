import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { announce } from "../../../utils/announce";
import { isDev } from "../../../utils/isDev";
import { mergeProps } from "../../../utils/mergeProps";
import { resolveButtonStyle } from "./buttonStyle";
import { Spinner } from "./Spinner";
import type { ButtonBaseComponentProps, ButtonProps } from "./types";
import classes from "./ButtonBase.module.css";

const isTrue = (value: unknown) => value === true || value === "true";
const present = (node: React.ReactNode) => node !== undefined && node !== null && node !== false;
const SEMANTIC = new Set(["button", "a", "summary"]);

/**
 * The implementation of the labelled button (and any link styled as a button). It owns:
 *
 * - **Anatomy** — `buttonContent` holding `leadingVisual`, `text` and `trailingVisual`. Every part carries a
 *   `data-component` name.
 * - **Size** — `size` sets height, padding, gap, label font, visual size and radius.
 * - **Look** — `variant` picks the colour set from `tokens.button`.
 * - **State** — rest / hover / pressed / focus / disabled, plus `inactive` and `loading`.
 *
 * The icon-only button is not built on this: it is its own component (`IconButton`).
 *
 * Token values reach the CSS as inline styles and element-scoped variables (see buttonStyle.ts):
 * the state colours as `--button-bg-hover`, … because a pseudo-class cannot be an inline style.
 */
export function ButtonBase<As extends React.ElementType = "button">(allProps: ButtonBaseComponentProps<As>) {
  const {
    as,
    variant,
    size,
    block,
    inactive,
    loading,
    loadingMessage = "Loading",
    leadingVisual,
    trailingVisual,
    alignContent,
    className,
    children,
    ...props
  } = allProps as unknown as ButtonProps & { as?: React.ElementType };

  const Component: React.ElementType = as ?? "button";
  const tokens = useTokens();
  const resolvedSize = size ?? "sm";
  const resolvedVariant = variant ?? "secondary";

  // Inactive, loading and a consumer's own aria-disabled all mean the same thing: focusable, but activation is ignored.
  const consumerAriaDisabled = isTrue(props["aria-disabled"]);
  const ariaDisabled = Boolean(inactive || loading || consumerAriaDisabled);
  const lookDisabled = Boolean(inactive || consumerAriaDisabled);

  // The component's handler runs first, and the consumer's is skipped when the event is default-prevented (mergeProps).
  const blockWhenAriaDisabled = (event: React.SyntheticEvent) => {
    if (ariaDisabled) event.preventDefault();
  };

  React.useEffect(() => {
    if (loading) announce(loadingMessage);
  }, [loading, loadingMessage]);

  React.useEffect(() => {
    if (!isDev()) return;
    if (typeof Component === "string" && !SEMANTIC.has(Component)) {
      console.warn(`ButtonBase should render a semantic <button> or <a>, but it is rendering <${Component}>.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a development check of the props at mount
  }, []);

  // While loading, the spinner takes the leading slot, or the trailing one if that is the only visual.
  const spinnerInTrailing = Boolean(loading) && !present(leadingVisual) && present(trailingVisual);
  const leading = loading && !spinnerInTrailing ? <Spinner /> : leadingVisual;
  const trailing = spinnerInTrailing ? <Spinner /> : trailingVisual;

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "ButtonBase",
          "data-variant": resolvedVariant,
          "data-size": resolvedSize,
          "data-block": block ? "" : undefined,
          "data-loading": loading ? "" : undefined,
          "data-inactive": lookDisabled ? "" : undefined,
          ...(Component === "button" ? { type: "button" as const } : {}),
          ...(ariaDisabled ? { "aria-disabled": true } : {}),
          className: clsx(classes.ButtonBase, className),
          onClick: blockWhenAriaDisabled,
          style: resolveButtonStyle(tokens, { variant: resolvedVariant, size: resolvedSize }),
        },
        props,
      )}
    >
      <span data-component="buttonContent" data-align={alignContent} className={classes.ButtonContent}>
        {present(leading) && (
          <span data-component="leadingVisual" className={clsx(classes.Visual, classes.LeadingVisual)} aria-hidden="true">
            {leading}
          </span>
        )}
        {present(children) && (
          <span data-component="text" className={classes.Label}>
            {children}
          </span>
        )}
        {present(trailing) && (
          <span data-component="trailingVisual" className={clsx(classes.Visual, classes.TrailingVisual)} aria-hidden="true">
            {trailing}
          </span>
        )}
      </span>
    </Component>
  );
}
