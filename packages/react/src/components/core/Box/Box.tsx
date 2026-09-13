import React, { forwardRef } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, GlobalColorPath, ThemeTokens } from "../../../theme/types";
import { functionalSurfaceCubeOverride } from "../../../theme/themeCubeOverride";
import { Stack, type StackProps } from "../Stack";
import styles from "./Box.module.css";
import type { BoxBorderRadius, BoxOverflow } from "./boxTypes";
import type { SpaceToken } from "../../../utils/spaceToken";
import { spaceTokenToCssVar } from "../../../utils/spaceToken";
import type { IconSize } from "../Icon";

export type {
  BoxBackground,
  BoxBorderColor,
  BoxBorderRadius,
  BoxForeground,
  BoxOverflow,
} from "./boxTypes";
export type { SpaceToken, SpaceToken as BoxMargin } from "../../../utils/spaceToken";

export interface BoxProps extends StackProps {
  /**
   * Surface background from `colors.global` (dot-path), or any CSS color string.
   * @example "bg.gray.light.1" | "canvas.inset"
   */
  background?: GlobalColorPath;
  /**
   * Border color from `colors.global` (dot-path), or any CSS color string.
   * Applies `sizes.borderWidth.thin` when set.
   * @example "border.gray.2" | "border.grayAlpha.2"
   */
  borderColor?: GlobalColorPath;
  /** Corner radius from `sizes.borderRadius`. */
  borderRadius?: BoxBorderRadius;
  /** Shorthand overflow on both axes — use `overflowX` / `overflowY` to diverge per axis. */
  overflow?: BoxOverflow;
  /**
   * Inherited text color from `colors.global` (dot-path), or any CSS color string.
   * @example "text.default" | "text.muted"
   */
  foreground?: GlobalColorPath;
  /** External offset on the block axis (top+bottom) — foundation spacing token (`"1x"` = 8px). */
  marginBlock?: SpaceToken;
  /** External offset on the block-start edge (top in horizontal writing modes). */
  marginBlockStart?: SpaceToken;
  /** External offset on the block-end edge (bottom in horizontal writing modes). */
  marginBlockEnd?: SpaceToken;
  /** External offset on the inline axis (start+end) — foundation spacing token (`"1x"` = 8px). */
  marginInline?: SpaceToken;
  /** External offset on the inline-start edge (left in LTR). Use for asymmetric insets — e.g. shifting only a leading title without affecting a trailing sibling. */
  marginInlineStart?: SpaceToken;
  /** External offset on the inline-end edge (right in LTR). */
  marginInlineEnd?: SpaceToken;
  /** External offset on the physical top edge — prefer `marginBlockStart` unless the layout must stay fixed under RTL. */
  marginTop?: SpaceToken;
  /** External offset on the physical right edge — prefer `marginInlineEnd` unless the layout must stay fixed under RTL. */
  marginRight?: SpaceToken;
  /** External offset on the physical bottom edge — prefer `marginBlockEnd` unless the layout must stay fixed under RTL. */
  marginBottom?: SpaceToken;
  /** External offset on the physical left edge — prefer `marginInlineStart` unless the layout must stay fixed under RTL. */
  marginLeft?: SpaceToken;
  /**
   * Square this box to a `sizes.icon` stop (`"md"` = 20px) — for sizing a
   * custom glyph/avatar to match an adjacent icon slot exactly, without a
   * hardcoded pixel value in consumer code.
   */
  size?: IconSize;
  theme?: CubeTheme;
}

function boxCssVars(
  props: Pick<BoxProps, "background" | "borderColor" | "foreground">,
  tokens: ThemeTokens,
): Record<string, string> {
  const { global } = tokens.colors;
  const vars: Record<string, string> = {};

  if (props.background) {
    vars["--box-bg"] = resolveGlobalColorOrCss(props.background, global);
  } else {
    vars["--box-bg"] = "transparent";
  }
  if (props.borderColor) {
    vars["--box-border-color"] = resolveGlobalColorOrCss(props.borderColor, global);
  }
  if (props.foreground) {
    vars["--box-fg"] = resolveGlobalColorOrCss(props.foreground, global);
  }

  return vars;
}

function boxModifierClasses(props: {
  borderColor?: GlobalColorPath;
  borderRadius?: BoxBorderRadius;
  overflow?: BoxOverflow;
}): string[] {
  const classes = [styles.Box];

  if (props.borderColor) {
    classes.push(styles["Box--bordered"]);
  }
  if (props.borderRadius) {
    classes.push(styles[`Box--radius-${props.borderRadius}` as keyof typeof styles]);
  }
  if (props.overflow) {
    classes.push(styles[`Box--overflow-${props.overflow}` as keyof typeof styles]);
  }

  return classes;
}

function boxMarginStyle(
  props: Pick<
    BoxProps,
    | "marginBlock"
    | "marginBlockStart"
    | "marginBlockEnd"
    | "marginInline"
    | "marginInlineStart"
    | "marginInlineEnd"
    | "marginTop"
    | "marginRight"
    | "marginBottom"
    | "marginLeft"
  >,
): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (props.marginBlock !== undefined) style.marginBlock = spaceTokenToCssVar(props.marginBlock);
  if (props.marginBlockStart !== undefined) {
    style.marginBlockStart = spaceTokenToCssVar(props.marginBlockStart);
  }
  if (props.marginBlockEnd !== undefined) {
    style.marginBlockEnd = spaceTokenToCssVar(props.marginBlockEnd);
  }
  if (props.marginInline !== undefined) {
    style.marginInline = spaceTokenToCssVar(props.marginInline);
  }
  if (props.marginInlineStart !== undefined) {
    style.marginInlineStart = spaceTokenToCssVar(props.marginInlineStart);
  }
  if (props.marginInlineEnd !== undefined) {
    style.marginInlineEnd = spaceTokenToCssVar(props.marginInlineEnd);
  }
  if (props.marginTop !== undefined) style.marginTop = spaceTokenToCssVar(props.marginTop);
  if (props.marginRight !== undefined) style.marginRight = spaceTokenToCssVar(props.marginRight);
  if (props.marginBottom !== undefined) style.marginBottom = spaceTokenToCssVar(props.marginBottom);
  if (props.marginLeft !== undefined) style.marginLeft = spaceTokenToCssVar(props.marginLeft);

  return style;
}

function boxSizeStyle(size: IconSize | undefined): React.CSSProperties {
  if (size === undefined) return {};
  const value = `var(--cube-icon-${size})`;
  return { width: value, height: value };
}

/**
 * Generic styled surface + flex layout primitive.
 *
 * Surface colors use global token paths from `globals.json`. Local `theme`
 * overrides re-bind `--cube-color-*` names on this element only.
 *
 * Margin props set **external** offset on this box only — use {@link Stack}
 * `gap` for spacing between flex children.
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    background,
    borderColor,
    borderRadius,
    overflow,
    foreground,
    marginBlock,
    marginBlockStart,
    marginBlockEnd,
    marginInline,
    marginInlineStart,
    marginInlineEnd,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    size,
    theme,
    className,
    style,
    children,
    ...stackProps
  },
  ref,
) {
  const tokens = useTheme(theme);

  const classNames = [
    ...boxModifierClasses({ borderColor, borderRadius, overflow }),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const themeOverride = theme
    ? (functionalSurfaceCubeOverride(tokens) as React.CSSProperties)
    : undefined;

  const surfaceVars = boxCssVars({ background, borderColor, foreground }, tokens);
  const marginStyle = boxMarginStyle({
    marginBlock,
    marginBlockStart,
    marginBlockEnd,
    marginInline,
    marginInlineStart,
    marginInlineEnd,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });
  const sizeStyle = boxSizeStyle(size);

  return (
    <Stack
      ref={ref}
      className={classNames}
      style={{ ...surfaceVars, ...themeOverride, ...marginStyle, ...sizeStyle, ...style }}
      {...stackProps}
    >
      {children}
    </Stack>
  );
});
