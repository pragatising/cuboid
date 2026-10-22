import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
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

/** A key of `tokens.text.size`: the same sizes `Text` has. */
export type LinkSize = keyof Tokens["text"]["size"];
/** When the link is underlined: `always`, only on `hover`, or `none`. */
export type LinkUnderline = "always" | "hover" | "none";

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
    /**
     * Which `text.size` token sets the font, the same sizes `Text` has. `standalone` defaults to `"md"`; `inline` and
     * `inherit` take the font from their parent unless this is set.
     */
    size?: LinkSize;
    /** Which `fontWeight` token sets the weight (`"light"`, `"normal"`, `"medium"`, `"semibold"`). Inherited unless set. */
    weight?: keyof Tokens["fontWeight"];
    /** When the link is underlined. @default "always", or "none" for `variant="inherit"` */
    underline?: LinkUnderline;
    /**
     * An `fgColor` token path or any CSS colour, replacing the `link` tokens' colour. It is the colour at rest and on
     * hover (a custom colour has no hover pair of its own, so hover is a slight fade).
     */
    color?: FgColor | CssColor;
    /** Looks disabled but stays focusable and announced; activation is ignored. Sets `aria-disabled`. @default false */
    inactive?: boolean;
  }
>;

/** A link. Colours come from the `link` tokens; the hover colour is picked by CSS from element-scoped variables. */
export function Link<As extends React.ElementType = "a">({
  as,
  variant = "standalone",
  external = false,
  showExternalIcon = true,
  size,
  weight,
  underline,
  color,
  inactive = false,
  className,
  children,
  ...props
}: LinkProps<As>) {
  const Component: React.ElementType = as ?? "a";
  const { link, text, fontWeight, fgColor, focusRing } = useTokens();
  const isAnchor = Component === "a";
  const { rel, ...rest } = props as { rel?: string };
  const customColor = color ? resolveColorValue(fgColor, color) : undefined;
  // `font` is a shorthand that resets the weight, so a font always comes with a weight (the body weight unless asked).
  const font = size ? text.size[size] : variant === "standalone" ? text.size.md : undefined;
  const resolvedUnderline = underline ?? (variant === "inherit" ? "none" : "always");

  return (
    <Component
      {...mergeProps(
        {
          "data-component": "Link",
          "data-variant": variant,
          "data-underline": resolvedUnderline,
          "data-custom-color": customColor ? "" : undefined,
          "data-inactive": inactive ? "" : undefined,
          ...(inactive ? { "aria-disabled": true, onClick: (event: React.SyntheticEvent) => event.preventDefault() } : {}),
          className: clsx(classes.Link, className as string | undefined),
          style: {
            ...(font ? { font, fontWeight: weight ? fontWeight[weight] : text.body.weight } : weight ? { fontWeight: fontWeight[weight] } : {}),
            ...cssVars("link", {
              ...(customColor
                ? { fg: { rest: customColor, hover: customColor } }
                : variant === "inherit"
                  ? {}
                  : { fg: link[variant].fgColor }),
              focusColor: focusRing.color,
              focusWidth: focusRing.width,
              focusOffset: focusRing.offset,
            }),
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
