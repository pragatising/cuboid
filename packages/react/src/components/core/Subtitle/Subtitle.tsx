import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { resolveColorPath } from "../../../utils/colorPaths";
import type { FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import classes from "./Subtitle.module.css";

export type SubtitleProps<As extends React.ElementType = "p"> = PolymorphicProps<
  As,
  "p",
  {
    /** Which `fgColor` token to colour the text with. @default the `subtitle.fgColor` token */
    color?: FgColor;
  }
>;

/**
 * Supporting text under a Heading: a page description or lead paragraph. It has one size
 * (the `subtitle.font` token), so there is no `size` prop.
 */
export function Subtitle<As extends React.ElementType = "p">({ as, color, className, ...props }: SubtitleProps<As>) {
  const Component: React.ElementType = as ?? "p";
  const { subtitle, fgColor } = useTokens();

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Subtitle",
          className: clsx(classes.Subtitle, className as string | undefined),
          style: { font: subtitle.font, color: color ? resolveColorPath(fgColor, color) : subtitle.fgColor },
        },
        props as object,
      )}
    />
  );
}
