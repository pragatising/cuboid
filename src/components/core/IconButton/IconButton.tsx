import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, IconButtonFunctionalColors, ThemeTokens } from "../../../theme/types";
import { tokenOutput } from "../../../theme/tokenOutput";
import { Tooltip } from "../Tooltip";
import type { TooltipPlacement } from "../Tooltip";
import styles from "./IconButton.module.css";

/** Keys of `iconButton` in `token-output.json` — add a variant in JSON + matching CSS module class `IconButton--<name>`. */
export type IconButtonVariant = keyof typeof tokenOutput.iconButton;
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

type IconButtonStop = keyof ThemeTokens["sizes"]["iconButton"];

const SIZE_TO_STOP: Record<IconButtonSize, IconButtonStop> = {
  xs: "extraSmall",
  sm: "small",
  md: "medium",
  lg: "large",
};

const SIZE_CLASS: Record<IconButtonSize, string> = {
  xs: styles["IconButton--size-xs"],
  sm: styles["IconButton--size-sm"],
  md: styles["IconButton--size-md"],
  lg: styles["IconButton--size-lg"],
};

const IB_STATES = ["rest", "hover", "pressed", "disabled"] as const;

function decorateIcon(icon: React.ReactNode) {
  if (!React.isValidElement(icon)) return icon;
  return React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, {
    "aria-hidden": true,
    focusable: false,
    ...((icon as React.ReactElement<Record<string, unknown>>).props ?? {}),
  });
}

function iconButtonCssVars(ib: IconButtonFunctionalColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const styleKey of Object.keys(ib)) {
    const variant = ib[styleKey];
    if (!variant) continue;
    for (const selKey of ["unselected", "selected"] as const) {
      const block = variant[selKey];
      for (const s of IB_STATES) {
        out[`--cube-iconButton-${styleKey}-${selKey}-bg-${s}`] = block.bgColor[s];
        out[`--cube-iconButton-${styleKey}-${selKey}-fg-${s}`] = block.fgColor[s];
        out[`--cube-iconButton-${styleKey}-${selKey}-border-${s}`] = block.borderColor[s];
      }
    }
  }
  return out;
}

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Icon only — pass a single SVG or element using `currentColor` for fills. */
  children: React.ReactNode;
  /** Maps to `sizes.iconButton` (hit area, radius, icon glyph — no label padding). */
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  /** Selected / toggled visual state (sets `aria-pressed` when not `undefined`) */
  selected?: boolean;
  /**
   * Optional tooltip label (hover + focus). The control still needs a concise **accessible name**
   * via `aria-label` (or `aria-labelledby`); the tooltip is wired with `aria-describedby` when open.
   * When both `disabled` and `tooltip` are set, the button stays focusable/hoverable and uses
   * `aria-disabled` instead of the native `disabled` attribute so the tooltip can show.
   */
  tooltip?: React.ReactNode;
  tooltipPlacement?: TooltipPlacement;
  tooltipCompact?: boolean;
  tooltipShowDelay?: number;
  theme?: CubeTheme;
}

const styleMap = styles as Record<string, string>;

export function IconButton({
  size = "xs",
  variant = "outlined",
  selected = false,
  theme,
  children,
  disabled,
  style,
  type,
  className: userClassName,
  tooltip,
  tooltipPlacement = "bottom",
  tooltipCompact = true,
  tooltipShowDelay = 200,
  "aria-pressed": ariaPressedProp,
  onClick,
  onKeyDown,
  ...rest
}: IconButtonProps) {
  const tokens = useTheme(theme);
  const selectionClass = selected ? styles["IconButton--selected"] : styles["IconButton--unselected"];
  const variantClass = styleMap[`IconButton--${variant}`];

  const className = [
    "cube-focusable",
    styles.IconButton,
    variantClass,
    selectionClass,
    SIZE_CLASS[size],
    userClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? (() => {
        const { functional } = tokens.colors;
        const stop = SIZE_TO_STOP[size];
        const cssSeg = stop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
        const geom = tokens.sizes.iconButton[stop];
        return {
          [`--cube-iconButton-${cssSeg}-size`]: geom.size,
          [`--cube-iconButton-${cssSeg}-borderRadius`]: geom.borderRadius,
          [`--cube-iconButton-${cssSeg}-icon`]: geom.icon,
          "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
          ...iconButtonCssVars(functional.iconButton),
        } as React.CSSProperties;
      })()
    : undefined;

  const ariaPressed =
    ariaPressedProp !== undefined ? ariaPressedProp : selected ? true : undefined;

  const hasTooltip = tooltip != null && tooltip !== "";
  /** Native `disabled` blocks hover/focus tooltips; pair with `aria-disabled` when a tooltip explains why. */
  const ariaDisabledForTooltip = Boolean(disabled && hasTooltip);
  const nativeDisabled = Boolean(disabled && !ariaDisabledForTooltip);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  const button = (
    <button
      type={type ?? "button"}
      disabled={nativeDisabled}
      aria-disabled={ariaDisabledForTooltip ? true : undefined}
      aria-pressed={ariaPressed}
      className={className}
      style={{ ...(style ?? {}), ...(inlineVars ?? {}) }}
      {...rest}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.IconButton__icon}>{decorateIcon(children)}</span>
    </button>
  );

  if (tooltip != null && tooltip !== "") {
    return (
      <Tooltip
        content={tooltip}
        placement={tooltipPlacement}
        compact={tooltipCompact}
        showDelay={tooltipShowDelay}
        theme={theme}
      >
        {button}
      </Tooltip>
    );
  }

  return button;
}
