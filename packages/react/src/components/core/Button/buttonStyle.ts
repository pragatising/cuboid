import type React from "react";
import type { Tokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { transitionCss } from "../../../utils/motion";
import type { Size, VariantType } from "./types";

type Options = {
  variant: VariantType;
  size: Size;
};

/**
 * Everything ButtonBase takes from the tokens, as inline styles: the colours of every state (as the
 * `--button-<property>-<state>` variables the CSS reads), the focus ring, and the size-dependent
 * geometry. Pure: tokens and options in, style objects out.
 */
export function resolveButtonStyle(tokens: Tokens, { variant, size }: Options): React.CSSProperties {
  const colors = tokens.button[variant];
  const control = tokens.size.control[size];

  const vars = cssVars("button", {
    bg: colors.bgColor,
    fg: colors.fgColor,
    border: colors.borderColor,
    iconSize: control.icon,
    gap: control.gap,
    focusColor: tokens.focusRing.color,
    focusWidth: tokens.focusRing.width,
    focusOffset: tokens.focusRing.offset,
  });

  return {
    ...vars,
    borderWidth: tokens.borderWidth.thin,
    transition: transitionCss(tokens.motion.transition.hover, ["background-color", "border-color", "color"]),
    font: tokens.button.font[size],
    height: control.size,
    paddingBlock: control.paddingBlock,
    paddingInline: tokens.button.paddingInline[size],
    borderRadius: variant === "rounded" ? tokens.borderRadius.full : control.borderRadius,
  };
}
