import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import classes from "./Heading.module.css";

/** The semantic level: which heading element is rendered. */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** A key of `tokens.heading.size`, named for the level it is the default for. The visual size, independent of the semantic level. */
export type HeadingSize = HeadingLevel;

export type HeadingProps<As extends HeadingLevel = "h2"> = PolymorphicProps<
  As,
  "h2",
  {
    /**
     * Which `heading.size` token to set the font from, named for the level it is the default for (`h1` 32px … `h6` 10px). Independent of `as`: an `h3` element can look like an `h1`. @default the size of the `as` level
     */
    size?: HeadingSize;
    /** Which `fgColor` token to colour the heading with, or any CSS colour. @default the `heading.fgColor` token */
    color?: FgColor | CssColor;
  }
>;

/**
 * A heading. `as` chooses the semantic level (h1–h6, for document structure and assistive
 * technology); `size` chooses how it looks and, unset, follows the level. They are independent: an `h3` can look large.
 */
export function Heading<As extends HeadingLevel = "h2">({ as, size, color, className, ...props }: HeadingProps<As>) {
  const Component: React.ElementType = as ?? "h2";
  const visual: HeadingSize = size ?? (as ?? "h2");
  const tokens = useTokens();
  const { heading } = tokens;
  const { fgColor } = colorGroups(tokens);

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Heading",
          "data-size": visual,
          className: clsx(classes.Heading, className as string | undefined),
          style: { font: heading.size[visual], color: color ? resolveColorValue(fgColor, color) : heading.fgColor },
        },
        props as object,
      )}
    />
  );
}
