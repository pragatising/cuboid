import React, { forwardRef } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, GlobalColorPath, ThemeTokens } from "../../../theme/types";
import { isResponsiveObject, resolveResponsive, type Responsive } from "../../../utils/responsive";
import type { SpaceToken } from "../../../utils/spaceToken";
import { spaceTokenToCssVar } from "../../../utils/spaceToken";
import styles from "./Box.module.css";
import type { BoxBorderRadius, BoxOverflowAxis } from "./boxTypes";

export type { BoxBackground, BoxBorderColor, BoxBorderRadius, BoxForeground, BoxOverflowAxis } from "./boxTypes";
export type { SpaceToken } from "../../../utils/spaceToken";

export type BoxDirection = "row" | "column";
export type BoxZIndex = keyof ThemeTokens["sizes"]["zIndex"];
export type BoxPosition = "static" | "relative" | "absolute" | "fixed" | "sticky";

/**
 * One box-model prop, three shapes:
 * - scalar → all sides/axes
 * - `{ block, inline }` → per-axis
 * - `{ top, right, bottom, left }` → per physical side
 * Pick whichever shape matches how asymmetric the spacing actually is —
 * don't reach for the 4-side form for a symmetric value.
 */
export type BoxSpacing<T> =
  | T
  | { block?: T; inline?: T }
  | { top?: T; right?: T; bottom?: T; left?: T };

export interface BoxProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color" | "style"> {
  as?: React.ElementType;

  /** Surface background — `colors.global` dot-path, or any CSS color string. */
  background?: GlobalColorPath;
  /** Border color — `colors.global` dot-path, or any CSS color string. Applies `sizes.borderWidth.thin` when set. */
  borderColor?: GlobalColorPath;
  /** Corner radius from `sizes.borderRadius`. */
  borderRadius?: BoxBorderRadius;
  /** Inherited text color — `colors.global` dot-path, or any CSS color string. */
  foreground?: GlobalColorPath;

  /** `flex-direction`. @default "column" */
  direction?: Responsive<BoxDirection>;
  /** Gap between children — an 8pt scale token (`space.*`). */
  gap?: Responsive<SpaceToken>;
  align?: Responsive<React.CSSProperties["alignItems"]>;
  justify?: Responsive<React.CSSProperties["justifyContent"]>;
  wrap?: Responsive<boolean>;
  grow?: boolean | number;
  shrink?: boolean | number;

  /**
   * Padding — scalar (all sides), `{block, inline}`, or `{top,right,bottom,left}`.
   * Values are `space.*` scale tokens. Not responsive yet — pass a scalar and
   * override with `style`-equivalent props at each breakpoint via `direction`/
   * `gap`'s pattern once padding needs it.
   */
  padding?: BoxSpacing<SpaceToken>;
  /** External margin — same three shapes as `padding`. Not responsive yet. */
  margin?: BoxSpacing<SpaceToken>;

  /** Token keyword (`"full"`, `"auto"`, …) or any CSS length. */
  width?: string;
  /** Any CSS length. */
  height?: string;
  minWidth?: string | 0;
  maxWidth?: string;
  maxHeight?: string;

  position?: BoxPosition;
  /** Shorthand inset on all sides. */
  inset?: BoxSpacing<SpaceToken | 0>;
  top?: SpaceToken | 0;
  right?: SpaceToken | 0;
  bottom?: SpaceToken | 0;
  left?: SpaceToken | 0;
  /** Layer from `sizes.zIndex` (e.g. `"dialog"`, `"overlay"`). */
  zIndex?: BoxZIndex;

  overflow?: BoxOverflowAxis;
  overflowX?: BoxOverflowAxis;
  overflowY?: BoxOverflowAxis;

  cursor?: React.CSSProperties["cursor"];
  opacity?: React.CSSProperties["opacity"];
  /** Raw CSS transition shorthand — no motion tokens wired up yet. */
  transition?: React.CSSProperties["transition"];
  display?: React.CSSProperties["display"];
  visibility?: React.CSSProperties["visibility"];
  whiteSpace?: React.CSSProperties["whiteSpace"];
  textOverflow?: React.CSSProperties["textOverflow"];
  pointerEvents?: React.CSSProperties["pointerEvents"];

  theme?: CubeTheme;
  className?: string;
  children?: React.ReactNode;
}

function directionToFlex(direction: BoxDirection | undefined): React.CSSProperties["flexDirection"] {
  return direction;
}

function spaceTokenOrZeroToCssVar(value: SpaceToken | 0): string {
  return value === 0 ? "0" : spaceTokenToCssVar(value);
}

function spacingToStyle<T extends SpaceToken | 0>(
  value: BoxSpacing<T> | undefined,
  prop: "padding" | "margin" | "inset",
  resolve: (v: T) => string,
): React.CSSProperties {
  if (value === undefined) return {};
  const style: Record<string, string | undefined> = {};

  if (typeof value !== "object") {
    style[prop] = resolve(value);
    return style;
  }

  if ("block" in value || "inline" in value) {
    if (value.block !== undefined) style[`${prop}Block`] = resolve(value.block);
    if (value.inline !== undefined) style[`${prop}Inline`] = resolve(value.inline);
    return style;
  }

  const sides = value as { top?: T; right?: T; bottom?: T; left?: T };
  if (sides.top !== undefined) style[`${prop}Top`] = resolve(sides.top);
  if (sides.right !== undefined) style[`${prop}Right`] = resolve(sides.right);
  if (sides.bottom !== undefined) style[`${prop}Bottom`] = resolve(sides.bottom);
  if (sides.left !== undefined) style[`${prop}Left`] = resolve(sides.left);
  return style;
}

function boxCssVars(
  props: Pick<BoxProps, "background" | "borderColor" | "foreground">,
  tokens: ThemeTokens,
): Record<string, string> {
  const { global } = tokens.colors;
  const vars: Record<string, string> = {
    "--box-bg": props.background ? resolveGlobalColorOrCss(props.background, global) : "transparent",
  };
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
}): string[] {
  const classes = [styles.Box];
  if (props.borderColor) classes.push(styles["Box--bordered"]);
  if (props.borderRadius) classes.push(styles[`Box--radius-${props.borderRadius}` as keyof typeof styles]);
  return classes;
}

/**
 * The one primitive: a styled `<div>` (or `as` element) that is also a full
 * flex container. Every visual/layout value is a typed prop backed by a
 * theme token or a raw CSS escape hatch typed via `React.CSSProperties` —
 * there is no `style` prop, by design, so nothing bypasses the token system.
 * `gap`/`padding`/`margin`/`inset` take `space.*` scale tokens directly —
 * Box is the one primitive everything else composes from, so it has no
 * named size scale of its own to keep in sync.
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    as: As = "div",
    background,
    borderColor,
    borderRadius,
    foreground,
    direction = "column",
    gap,
    align,
    justify,
    wrap,
    grow,
    shrink,
    padding,
    margin,
    width,
    height,
    minWidth,
    maxWidth,
    maxHeight,
    position,
    inset,
    top,
    right,
    bottom,
    left,
    zIndex,
    overflow,
    overflowX,
    overflowY,
    cursor,
    opacity,
    transition,
    display,
    visibility,
    whiteSpace,
    textOverflow,
    pointerEvents,
    theme,
    className,
    children,
    ...rest
  },
  ref,
) {
  const tokens = useTheme(theme);

  const directionResolved = resolveResponsive(direction);
  const gapResolved = resolveResponsive(gap);
  const alignResolved = resolveResponsive(align);
  const justifyResolved = resolveResponsive(justify);
  const wrapResolved = resolveResponsive(wrap);
  const isResponsive =
    isResponsiveObject(direction) ||
    isResponsiveObject(gap) ||
    isResponsiveObject(align) ||
    isResponsiveObject(justify) ||
    isResponsiveObject(wrap);

  const classNames = [...boxModifierClasses({ borderColor, borderRadius }), className]
    .filter(Boolean)
    .join(" ");

  const responsiveVars: Record<string, string> = {};
  if (isResponsive) {
    for (const tier of ["sm", "md", "lg"] as const) {
      const dir = directionToFlex(directionResolved[tier]);
      if (dir) responsiveVars[`--box-direction-${tier}`] = dir;
      const g = gapResolved[tier];
      if (g !== undefined) responsiveVars[`--box-gap-${tier}`] = spaceTokenToCssVar(g);
      if (alignResolved[tier] !== undefined) responsiveVars[`--box-align-${tier}`] = String(alignResolved[tier]);
      if (justifyResolved[tier] !== undefined) responsiveVars[`--box-justify-${tier}`] = String(justifyResolved[tier]);
      if (wrapResolved[tier] !== undefined) responsiveVars[`--box-wrap-${tier}`] = wrapResolved[tier] ? "wrap" : "nowrap";
    }
  }

  const style: React.CSSProperties = {
    ...boxCssVars({ background, borderColor, foreground }, tokens),
    ...(isResponsive
      ? responsiveVars
      : {
          flexDirection: directionToFlex(direction as BoxDirection),
          gap: gap !== undefined ? spaceTokenToCssVar(gap) : undefined,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap === undefined ? undefined : wrap ? "wrap" : "nowrap",
        }),
    ...spacingToStyle(padding, "padding", spaceTokenToCssVar),
    ...spacingToStyle(margin, "margin", spaceTokenToCssVar),
    ...(typeof grow === "number" ? { flexGrow: grow } : grow === true ? { flexGrow: 1 } : grow === false ? { flexGrow: 0 } : {}),
    ...(typeof shrink === "number" ? { flexShrink: shrink } : shrink === true ? { flexShrink: 1 } : shrink === false ? { flexShrink: 0 } : {}),
    width,
    height,
    minWidth,
    maxWidth,
    maxHeight,
    position,
    ...spacingToStyle(inset, "inset", spaceTokenOrZeroToCssVar),
    top: top !== undefined ? spaceTokenOrZeroToCssVar(top) : undefined,
    right: right !== undefined ? spaceTokenOrZeroToCssVar(right) : undefined,
    bottom: bottom !== undefined ? spaceTokenOrZeroToCssVar(bottom) : undefined,
    left: left !== undefined ? spaceTokenOrZeroToCssVar(left) : undefined,
    zIndex: zIndex !== undefined ? tokens.sizes.zIndex[zIndex] : undefined,
    overflow,
    overflowX,
    overflowY,
    cursor,
    opacity,
    transition,
    display,
    visibility,
    whiteSpace,
    textOverflow,
    pointerEvents,
  };

  return (
    <As ref={ref} className={classNames} style={style} {...rest}>
      {children}
    </As>
  );
});
