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
  /** Shorthand overflow — use `overflowX` / `overflowY` in `style` to override an axis. */
  overflow?: BoxOverflow;
  /**
   * Inherited text color from `colors.global` (dot-path), or any CSS color string.
   * @example "text.default" | "text.muted"
   */
  foreground?: GlobalColorPath;
  /** External offset — foundation spacing token (`"2x"`, `"16"`, …). */
  marginBlock?: SpaceToken;
  marginBlockStart?: SpaceToken;
  marginBlockEnd?: SpaceToken;
  marginInline?: SpaceToken;
  marginInlineStart?: SpaceToken;
  marginInlineEnd?: SpaceToken;
  marginTop?: SpaceToken;
  marginRight?: SpaceToken;
  marginBottom?: SpaceToken;
  marginLeft?: SpaceToken;
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

  return (
    <Stack
      ref={ref}
      className={classNames}
      style={{ ...surfaceVars, ...themeOverride, ...marginStyle, ...style }}
      {...stackProps}
    >
      {children}
    </Stack>
  );
});
