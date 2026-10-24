import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { BgColor, BorderColor, CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import classes from "./Pill.module.css";

/** A key of `tokens.pill.color`: the colour family. */
export type PillShade = keyof Tokens["pill"]["color"];
/** A key of every shade in `tokens.pill.color`: the emphasis step. */
export type PillIntensity = keyof Tokens["pill"]["color"]["gray"];
/** A key of `tokens.text.size`. */
export type PillSize = "sm" | "md" | "lg";

export type PillProps<As extends React.ElementType = "span"> = PolymorphicProps<
  As,
  "span",
  {
    /** Which `pill.color` family to colour the pill with. @default "gray" */
    shade?: PillShade;
    /** Emphasis step within the shade. @default "light" */
    intensity?: PillIntensity;
    /** Use the bordered surface rather than the filled one. @default false */
    bordered?: boolean;
    /** Which `fontWeight` token sets the label's weight. @default "medium" */
    weight?: keyof Tokens["fontWeight"];
    /** Which `text.size` token to set the label font from. The pill's height stays fixed. @default "sm" */
    size?: PillSize;
    /** Override the label colour: a `fgColor` token, a palette colour (`"indigo.7"`) or any CSS colour. */
    color?: FgColor | CssColor;
    /** Override the surface: a `bgColor` token, a palette colour (`"indigo.0"`) or any CSS colour. */
    backgroundColor?: BgColor | CssColor;
    /** Override the border colour: a `borderColor` token, a palette colour (`"indigo.5"`) or any CSS colour. */
    borderColor?: BorderColor | CssColor;
    leadingVisual?: React.ReactNode;
    /** Pass `<Icon size="…">`: the pill's height stays fixed regardless of icon size. */
    trailingVisual?: React.ReactNode;
  }
>;

/** A static chip or tag. Colours do not change on hover; give it `as="a"` or `as="button"` to make it interactive. */
export function Pill<As extends React.ElementType = "span">({
  as,
  shade = "gray",
  intensity = "light",
  bordered = false,
  weight = "medium",
  size = "sm",
  color,
  backgroundColor,
  borderColor,
  leadingVisual,
  trailingVisual,
  className,
  children,
  ...props
}: PillProps<As>) {
  const Component: React.ElementType = as ?? "span";
  const tokens = useTokens();
  const { pill, text, fontWeight, borderWidth } = tokens;
  const palette = colorGroups(tokens);
  const colors = pill.color[shade][intensity][bordered ? "bordered" : "filled"];

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Pill",
          className: clsx(classes.Pill, className as string | undefined),
          style: {
            // `lineHeight` comes after the `font` shorthand, which resets it: the pill's height is fixed.
            font: text.size[size],
            fontWeight: fontWeight[weight],
            lineHeight: 1,
            color: color ? resolveColorValue(palette.fgColor, color) : colors.fgColor,
            backgroundColor: backgroundColor ? resolveColorValue(palette.bgColor, backgroundColor) : colors.bgColor,
            borderColor: borderColor ? resolveColorValue(palette.borderColor, borderColor) : colors.borderColor,
            borderWidth: borderWidth.thin,
            gap: pill.sizes.gap,
            height: pill.sizes.height,
            paddingBlock: pill.sizes.paddingBlock,
            paddingInline: pill.sizes.paddingInline,
            borderRadius: pill.sizes.borderRadius,
          },
        },
        props as object,
      )}
    >
      {leadingVisual ? <span data-component="Pill.LeadingVisual" className={classes.Visual}>{leadingVisual}</span> : null}
      {children as React.ReactNode}
      {trailingVisual ? <span data-component="Pill.TrailingVisual" className={classes.Visual}>{trailingVisual}</span> : null}
    </Component>
  );
}
