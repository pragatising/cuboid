import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import { Icon } from "../Icon";
import classes from "./Link.module.css";

/**
 * `inline`: inside body copy, inherits the font from its parent.
 * `standalone`: nav, footer, contact rows.
 * `inherit`: composition wrapper (e.g. pill links); no underline, inherits colour.
 */
export type LinkVariant = "inline" | "standalone" | "inherit";

export type LinkProps<As extends React.ElementType = "a"> = PolymorphicProps<
  As,
  "a",
  {
    /** Which look to use. `inline` and `standalone` read the `link` colour tokens. @default "standalone" */
    variant?: LinkVariant;
    /** Opens in a new tab with `rel="noopener noreferrer"` (when rendered as an anchor). @default false */
    external?: boolean;
    /** Show the open-in-new icon when `external`. @default true */
    showExternalIcon?: boolean;
  }
>;

/** A link. Colours come from the `link` tokens; the hover colour is picked by CSS from element-scoped variables. */
export function Link<As extends React.ElementType = "a">({
  as,
  variant = "standalone",
  external = false,
  showExternalIcon = true,
  className,
  children,
  ...props
}: LinkProps<As>) {
  const Component: React.ElementType = as ?? "a";
  const { link, text, focusRing } = useTokens();
  const isAnchor = Component === "a";
  const { rel, ...rest } = props as { rel?: string };

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Link",
          "data-variant": variant,
          className: clsx(classes.Link, className as string | undefined),
          style: {
            ...cssVars("link", {
              ...(variant === "inherit" ? {} : { fg: link[variant].fgColor }),
              focusColor: focusRing.color,
              focusWidth: focusRing.width,
              focusOffset: focusRing.offset,
            }),
            ...(variant === "standalone" ? { font: text.size.md } : {}),
          },
          ...(external && isAnchor ? { target: "_blank", rel: [rel, "noopener", "noreferrer"].filter(Boolean).join(" ") } : { rel }),
        },
        rest as object,
      )}
    >
      {children as React.ReactNode}
      {external && showExternalIcon && variant !== "inherit" && (
        <Icon name="open_in_new" size="xs" className={classes.ExternalIcon} />
      )}
    </Component>
  );
}
