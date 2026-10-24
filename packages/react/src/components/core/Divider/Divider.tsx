import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { BorderColor, CssColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Divider.module.css";

/** A key of `tokens.divider.color`. */
export type DividerColor = "default" | "muted";

export type DividerProps = Omit<React.ComponentPropsWithRef<"hr">, "color" | "children"> & {
  /**
   * Which `divider.color` token to draw the rule with, or any `borderColor` token, palette colour (`"indigo.3"`) or CSS colour.
   * @default "default"
   */
  color?: DividerColor | BorderColor | CssColor;
};

/** A horizontal rule separating content. Colour and thickness come from the `divider` tokens. */
export function Divider({ color = "default", className, ...props }: DividerProps) {
  const tokens = useTokens();
  const { divider } = tokens;
  const fill = color in divider.color ? divider.color[color as DividerColor] : resolveColorValue(colorGroups(tokens).borderColor, color);

  return (
    <hr
      {...mergeProps(
        {
          "data-component": "Divider",
          className: clsx(classes.Divider, className),
          style: { backgroundColor: fill, height: divider.thickness },
        },
        props,
      )}
    />
  );
}
