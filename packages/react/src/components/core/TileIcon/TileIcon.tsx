import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { BgColor, CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import type { IconProps } from "../Icon";
import classes from "./TileIcon.module.css";

export type TileIconProps = Omit<React.ComponentPropsWithRef<"span">, "color" | "children"> & {
  /** Canonical Material Symbols name of the glyph, e.g. `"celebration"`. */
  name: IconProps["name"];
  /** Which `icon` size token sets the glyph. The tile grows with it. @default "sm" */
  size?: IconProps["size"];
  /** The tile's fill: any `bgColor` token (`"canvas.inset"`, `"informational.subtle"`…), palette colour (`"indigo.0"`) or any CSS colour. @default "canvas.inset" */
  backgroundColor?: BgColor | CssColor;
  /** The glyph's colour: any `fgColor` token, palette colour or any CSS colour. @default "neutral.muted" */
  color?: FgColor | CssColor;
  /** When set, the tile is exposed as `role="img"` with this accessible name; otherwise it is decorative. */
  label?: string;
};

/**
 * An icon in a small rounded tile with a background colour: the visual of an `EmptyState`, or a marker beside a title.
 * It is the `Icon` component in a pill, with no tokens of its own: the fill and the glyph colour are props.
 */
export function TileIcon({ name, size = "sm", backgroundColor = "canvas.inset", color = "neutral.muted", label, className, style, ...props }: TileIconProps) {
  const tokens = useTokens();
  const { bgColor } = colorGroups(tokens);

  return (
    <span
      {...mergeProps(
        {
          "data-component": "TileIcon",
          className: clsx(classes.TileIcon, className),
          style: { backgroundColor: resolveColorValue(bgColor, backgroundColor), ...style },
        },
        props as object,
      )}
    >
      <Icon name={name} size={size} color={color} label={label} />
    </span>
  );
}
