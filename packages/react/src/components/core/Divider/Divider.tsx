import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Divider.module.css";

/** A key of `tokens.divider.color`. */
export type DividerColor = "default" | "muted";

export type DividerProps = Omit<React.ComponentPropsWithRef<"hr">, "color" | "children"> & {
  /** Which `divider.color` token to draw the rule with. @default "default" */
  color?: DividerColor;
};

/** A horizontal rule separating content. Colour and thickness come from the `divider` tokens. */
export function Divider({ color = "default", className, ...props }: DividerProps) {
  const { divider } = useTokens();

  return (
    <hr
      {...mergeProps(
        {
          "data-component": "Divider",
          className: clsx(classes.Divider, className),
          style: { backgroundColor: divider.color[color], height: divider.thickness },
        },
        props,
      )}
    />
  );
}
