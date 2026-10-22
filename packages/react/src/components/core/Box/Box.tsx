import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { resolveColorPath } from "../../../utils/colorPaths";
import type { BgColor, BorderColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import { resolveSpace } from "../../../utils/space";
import type { Space } from "../../../utils/space";
import classes from "./Box.module.css";

type Css = React.CSSProperties;

/**
 * One box-model prop, three shapes:
 * - scalar -> all sides
 * - `{ block, inline }` -> per axis
 * - `{ top, right, bottom, left }` -> per physical side
 * Pick whichever shape matches how asymmetric the spacing actually is.
 */
export type BoxSpacing<T> = T | { block?: T; inline?: T } | { top?: T; right?: T; bottom?: T; left?: T };

export type BoxOwnProps = {
  /** Element colours, chosen by token path. `backgroundColor` -> `bgColor.*`, `borderColor` -> `borderColor.*`, `color` (text) -> `fgColor.*`. */
  backgroundColor?: BgColor;
  /** Applies a `borderWidth.thin` solid border in this colour. */
  borderColor?: BorderColor;
  color?: FgColor;
  /** A key of `tokens.borderRadius`. */
  borderRadius?: keyof Tokens["borderRadius"];

  /**
   * The CSS `display` value. Box is a flex container by default; pass `"inline-flex"`, `"grid"`, `"block"`, …
   * for anything else (the flex props below then do nothing).
   * @default "flex"
   */
  display?: Css["display"];
  /** CSS `flex-direction`. @default "column" */
  flexDirection?: Css["flexDirection"];
  flexWrap?: Css["flexWrap"];
  flexGrow?: Css["flexGrow"];
  flexShrink?: Css["flexShrink"];
  alignItems?: Css["alignItems"];
  justifyContent?: Css["justifyContent"];
  /** CSS `gap`, from a spacing token: Nx scale (`"1.5x"` = 12px) or semantic (`"sm"`). `0` is `0`. */
  gap?: Space | 0;

  /** CSS `padding` / `margin`, from spacing tokens (or `0`): scalar, `{block, inline}` or `{top, right, bottom, left}`. */
  padding?: BoxSpacing<Space | 0>;
  margin?: BoxSpacing<Space | 0>;

  width?: Css["width"];
  height?: Css["height"];
  minWidth?: Css["minWidth"];
  maxWidth?: Css["maxWidth"];
  minHeight?: Css["minHeight"];
  maxHeight?: Css["maxHeight"];

  position?: Css["position"];
  /** CSS `inset` / `top` / `right` / `bottom` / `left`, from spacing tokens (or `0`). */
  inset?: BoxSpacing<Space | 0>;
  top?: Space | 0;
  right?: Space | 0;
  bottom?: Space | 0;
  left?: Space | 0;
  /** A key of `tokens.zIndex` (`"dialog"`, `"overlay"`, …). */
  zIndex?: keyof Tokens["zIndex"];

  overflow?: Css["overflow"];
  overflowX?: Css["overflowX"];
  overflowY?: Css["overflowY"];
  cursor?: Css["cursor"];
  opacity?: Css["opacity"];
  transition?: Css["transition"];
  visibility?: Css["visibility"];
  whiteSpace?: Css["whiteSpace"];
  textOverflow?: Css["textOverflow"];
  pointerEvents?: Css["pointerEvents"];
};

export type BoxProps<As extends React.ElementType = "div"> = PolymorphicProps<As, "div", BoxOwnProps>;

type Resolve = (value: Space) => string;

const zero = (resolve: Resolve) => (value: Space | 0) => (value === 0 ? "0" : resolve(value));

/** One spacing prop (`padding`, `margin`, `inset`) -> its CSS longhands, picking the shape the consumer used. */
function spacingToStyle<T extends Space | 0>(
  value: BoxSpacing<T> | undefined,
  prop: "padding" | "margin" | "inset",
  resolve: (v: T) => string,
): Css {
  if (value === undefined) return {};
  const style: Record<string, string> = {};

  if (typeof value !== "object") {
    style[prop] = resolve(value);
  } else if ("block" in value || "inline" in value) {
    if (value.block !== undefined) style[`${prop}Block`] = resolve(value.block);
    if (value.inline !== undefined) style[`${prop}Inline`] = resolve(value.inline);
  } else {
    const sides = value as { top?: T; right?: T; bottom?: T; left?: T };
    for (const side of ["top", "right", "bottom", "left"] as const) {
      if (sides[side] !== undefined) style[`${prop}${side[0].toUpperCase()}${side.slice(1)}`] = resolve(sides[side] as T);
    }
  }
  return style;
}

/** Drop the keys the consumer didn't set, so unset props add nothing to the inline style. */
const defined = (style: Css): Css => Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined));

/**
 * A flexbox container: a `div` (or any `as` element) whose props are the CSS properties of the
 * same name. Where a CSS value is a design decision — colours, radius, spacing, z-index — the prop
 * takes a token instead of a raw value. It is `display: flex` by default; anything else a consumer
 * needs goes through `style`.
 */
export function Box<As extends React.ElementType = "div">({
  as,
  backgroundColor,
  borderColor,
  color,
  borderRadius,
  display,
  flexDirection = "column",
  flexWrap,
  flexGrow,
  flexShrink,
  alignItems,
  justifyContent,
  gap,
  padding,
  margin,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
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
  visibility,
  whiteSpace,
  textOverflow,
  pointerEvents,
  className,
  ...props
}: BoxProps<As>) {
  const Component: React.ElementType = as ?? "div";
  const tokens = useTokens();
  const space: Resolve = (value) => resolveSpace(tokens, value);
  const spaceOrZero = zero(space);

  const style: Css = {
    flexDirection,
    ...defined({
      display,
      flexWrap,
      flexGrow,
      flexShrink,
      alignItems,
      justifyContent,
      gap: gap !== undefined ? spaceOrZero(gap) : undefined,
      backgroundColor: backgroundColor ? resolveColorPath(tokens.bgColor, backgroundColor) : undefined,
      color: color ? resolveColorPath(tokens.fgColor, color) : undefined,
      borderRadius: borderRadius ? tokens.borderRadius[borderRadius] : undefined,
      ...(borderColor
        ? { borderStyle: "solid", borderWidth: tokens.borderWidth.thin, borderColor: resolveColorPath(tokens.borderColor, borderColor) }
        : {}),
      width,
      height,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      position,
      top: top !== undefined ? spaceOrZero(top) : undefined,
      right: right !== undefined ? spaceOrZero(right) : undefined,
      bottom: bottom !== undefined ? spaceOrZero(bottom) : undefined,
      left: left !== undefined ? spaceOrZero(left) : undefined,
      zIndex: zIndex !== undefined ? tokens.zIndex[zIndex] : undefined,
      overflow,
      overflowX,
      overflowY,
      cursor,
      opacity,
      transition,
      visibility,
      whiteSpace,
      textOverflow,
      pointerEvents,
    }),
    ...spacingToStyle(padding, "padding", spaceOrZero),
    ...spacingToStyle(margin, "margin", spaceOrZero),
    ...spacingToStyle(inset, "inset", spaceOrZero),
  };

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Box",
          className: clsx(classes.Box, className as string | undefined),
          style,
        },
        props as object,
      )}
    />
  );
}
