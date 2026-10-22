import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { resolveColorPath } from "../../../utils/colorPaths";
import type { BgColor } from "../../../utils/colorPaths";
import classes from "./Callout.module.css";

export type CalloutProps = Omit<React.ComponentPropsWithRef<"div">, "color"> & {
  /** Which `bgColor` token to use for the surface. @default the `callout.bgColor` token */
  backgroundColor?: BgColor;
};

/** Inset block for blockquotes, notes and asides. */
export function Callout({ backgroundColor, className, ...props }: CalloutProps) {
  const { callout, bgColor } = useTokens();

  return (
    <div
      {...mergeProps(
        {
          "data-component": "Callout",
          className: clsx(classes.Callout, className),
          style: {
            backgroundColor: backgroundColor ? resolveColorPath(bgColor, backgroundColor) : callout.bgColor,
            color: callout.fgColor,
            paddingBlock: callout.paddingBlock,
            paddingInline: callout.paddingInline,
            borderRadius: callout.borderRadius,
          },
        },
        props,
      )}
    />
  );
}
