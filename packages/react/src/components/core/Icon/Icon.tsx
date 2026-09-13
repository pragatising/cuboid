import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, IconSizesTokens } from "../../../theme/types";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { GlobalColorPath } from "../../../theme/types";
import type { IconAxes } from "../../../icons/IconLibrary";
import type { IconName } from "../../../icons/material/iconNames.generated";
import styles from "./Icon.module.css";

export type { IconName };
export type IconSize = keyof IconSizesTokens;

const SIZE_CLASS: Record<IconSize, string> = {
  xs: styles["Icon--size-xs"],
  sm: styles["Icon--size-sm"],
  md: styles["Icon--size-md"],
  lg: styles["Icon--size-lg"],
};

export interface IconProps {
  /** Canonical Material Symbols name (or whatever `theme.icon.library` resolves), e.g. `"account_circle"`. */
  name: IconName;
  size?: IconSize;
  /**
   * Color from `colors.global` (dot-path), or any raw CSS color string.
   * Applied as `currentColor` — glyph inherits it. Same convention as `Text`'s `color` prop.
   * @default inherits ambient text color
   */
  color?: GlobalColorPath;
  /** When set, exposes `role="img"` + `aria-label`; otherwise the icon is decorative. */
  label?: string;
  /** Per-call override of `theme.icon.weight` (100–700). */
  weight?: number;
  /** Per-call override of `theme.icon.grade` (-25–200). */
  grade?: number;
  /** Per-call override of `theme.icon.opticalSize` (20–48). */
  opticalSize?: number;
  /** Per-call override of `theme.icon.fill`. */
  fill?: boolean;
  theme?: CubeTheme;
  className?: string;
}

export function Icon({
  name,
  size = "sm",
  color,
  label,
  weight,
  grade,
  opticalSize,
  fill,
  theme,
  className,
}: IconProps) {
  const tokens = useTheme(theme);

  const inlineVars = theme
    ? ({
        [`--cube-icon-${size}`]: tokens.sizes.icon[size],
      } as React.CSSProperties)
    : undefined;

  const classNameMerged = [styles.Icon, SIZE_CLASS[size], className].filter(Boolean).join(" ");

  const axes: IconAxes = {
    weight: weight ?? tokens.icon.weight,
    grade: grade ?? tokens.icon.grade,
    opticalSize: opticalSize ?? tokens.icon.opticalSize,
    fill: fill ?? tokens.icon.fill,
    style: tokens.icon.style,
  };

  const glyph = tokens.icon.library.resolve(name, axes);
  const svg = React.isValidElement(glyph)
    ? React.cloneElement(glyph as React.ReactElement<Record<string, unknown>>, {
        "aria-hidden": label ? undefined : true,
        focusable: false,
        ...((glyph as React.ReactElement<Record<string, unknown>>).props ?? {}),
      })
    : glyph;

  const resolvedColor = color
    ? resolveGlobalColorOrCss(color, tokens.colors.global)
    : undefined;
  const colorStyle: React.CSSProperties | undefined = resolvedColor
    ? { color: resolvedColor }
    : undefined;

  if (label) {
    return (
      <span
        className={classNameMerged}
        style={{ ...inlineVars, ...colorStyle }}
        role="img"
        aria-label={label}
      >
        {svg}
      </span>
    );
  }

  return (
    <span className={classNameMerged} style={{ ...inlineVars, ...colorStyle }} aria-hidden>
      {svg}
    </span>
  );
}
