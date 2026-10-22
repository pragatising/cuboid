import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import classes from "./Heading.module.css";

/** The semantic level: which heading element is rendered. */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** A key of `tokens.heading.size`. The visual size, independent of the semantic level. */
export type HeadingSize = "sm" | "md" | "lg";

export type HeadingProps<As extends HeadingLevel = "h2"> = PolymorphicProps<
  As,
  "h2",
  {
    /** Which `heading.size` token to set the font from. Independent of `as`. @default "lg" */
    size?: HeadingSize;
    /** Which `fgColor` token to colour the heading with, or any CSS colour. @default the `heading.fgColor` token */
    color?: FgColor | CssColor;
  }
>;

/**
 * A heading. `as` chooses the semantic level (h1–h6, for document structure and assistive
 * technology); `size` chooses how it looks. They are independent: an `h3` can look large.
 */
export function Heading<As extends HeadingLevel = "h2">({ as, size = "lg", color, className, ...props }: HeadingProps<As>) {
  const Component: React.ElementType = as ?? "h2";
  const { heading, fgColor } = useTokens();

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Heading",
          className: clsx(classes.Heading, className as string | undefined),
          style: { font: heading.size[size], color: color ? resolveColorValue(fgColor, color) : heading.fgColor },
        },
        props as object,
      )}
    />
  );
}
