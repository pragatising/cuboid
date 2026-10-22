import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Highlight.module.css";

/** A colour key of `tokens.highlight` (the group also carries the shared padding and radius). */
export type HighlightColor = Exclude<keyof Tokens["highlight"], "paddingInline" | "paddingBlock" | "borderRadius">;

export type HighlightProps = Omit<React.ComponentPropsWithRef<"mark">, "color"> & {
  /** Which `highlight` colour to tint the text with. @default "yellow" */
  color?: HighlightColor;
};

/**
 * Inline marker emphasis inside body copy. Renders a semantic `<mark>` and inherits the
 * surrounding font, so use it inside `Text`.
 */
export function Highlight({ color = "yellow", className, ...props }: HighlightProps) {
  const { highlight } = useTokens();

  return (
    <mark
      {...mergeProps(
        {
          "data-component": "Highlight",
          className: clsx(classes.Highlight, className),
          style: {
            color: highlight[color].fgColor,
            backgroundColor: highlight[color].bgColor,
            paddingInline: highlight.paddingInline,
            paddingBlock: highlight.paddingBlock,
            borderRadius: highlight.borderRadius,
          },
        },
        props,
      )}
    />
  );
}
