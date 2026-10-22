import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import classes from "./Text.module.css";

/** A key of `tokens.text.size`. */
export type TextSize = "sm" | "md" | "lg";

/** Any foreground colour token as `group.key` (see `FgColor`), or any CSS colour (`"red"`, `"#fff"`, `"currentColor"`). */
export type TextColor = FgColor | CssColor;

export type TextProps<As extends React.ElementType = "p"> = PolymorphicProps<
  As,
  "p",
  {
    /** Which `text.size` token to set the font from. @default "md" */
    size?: TextSize;
    /** Which `fgColor` token to colour the text with, or any CSS colour. @default the `text.fgColor` token */
    color?: TextColor;
    /** Which `fontWeight` token to set the weight from. @default the regular body weight */
    weight?: keyof Tokens["fontWeight"];
    /** The CSS `white-space` property: how spaces, tabs and line breaks are treated. */
    whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line";
    /** Shortcut for one line cut off with an ellipsis (`overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`). */
    truncate?: boolean;
  }
>;

/**
 * Body text. Headings, subtitles and inline code are their own components:
 * they have their own typography tokens and no `role` switch to pick between.
 */
export function Text<As extends React.ElementType = "p">({
  as,
  size = "md",
  color,
  weight,
  whiteSpace,
  truncate = false,
  className,
  ...props
}: TextProps<As>) {
  const Component: React.ElementType = as ?? "p";
  const { text, fgColor, fontWeight } = useTokens();

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Text",
          "data-white-space": whiteSpace,
          className: clsx(classes.Text, truncate && classes.Truncate, className as string | undefined),
          // `fontWeight` comes after the `font` shorthand, which resets it. It is always set (default: the
          // body weight the shorthand already carries) so toggling `weight` never removes a longhand while
          // the shorthand is present, which React warns about.
          style: {
            font: text.size[size],
            fontWeight: weight ? fontWeight[weight] : text.body.weight,
            color: color ? resolveColorValue(fgColor, color) : text.fgColor,
          },
        },
        props as object,
      )}
    />
  );
}
