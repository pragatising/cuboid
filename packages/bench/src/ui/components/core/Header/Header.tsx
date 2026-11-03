import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { CssColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { Length, SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import type { BoxProps } from "../Box";
import classes from "./Header.module.css";

export type HeaderProps = Omit<React.ComponentPropsWithRef<"header">, "color"> & {
  /** `Header.Leading`, `Header.Trailing`, or anything else: they sit in a row, spread apart. */
  children?: React.ReactNode;
};

/**
 * The top bar of a page: a `<header>` (the banner landmark) with its content in slots. Put navigation in `Header.Leading`
 * (a menu button, breadcrumbs, a back button and a `Header.Divider`) and actions in `Header.Trailing` (search, buttons).
 * Its look comes from the `siteHeader` tokens.
 */
function HeaderRoot({ className, children, ...props }: HeaderProps) {
  const { siteHeader } = useTokens();
  const { color, sizes } = siteHeader;

  return (
    <Box
      as="header"
      {...mergeProps({ "data-component": "Header", className: clsx(classes.Header, className) }, props as object)}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      boxSizing="border-box"
      minHeight={resolved<Length>(sizes.height)}
      paddingBlock={resolved<SpaceValue>(sizes.paddingBlock)}
      paddingInlineStart={resolved<SpaceValue>(sizes.paddingInlineStart)}
      paddingInlineEnd={resolved<SpaceValue>(sizes.paddingInlineEnd)}
      backgroundColor={resolved<CssColor>(color.background)}
      borderBottom={{ color: resolved<CssColor>(color.border), width: "thin" }}
    >
      {children}
    </Box>
  );
}

export type HeaderSlotProps = BoxProps<"div">;

/** The start of the bar: it takes the free space, and its content sits in a row with the `siteHeader` leading gap. */
function HeaderLeading(props: HeaderSlotProps) {
  const { siteHeader } = useTokens();
  return (
    <Box
      data-component="Header.Leading"
      flexDirection="row"
      alignItems="center"
      flex="1 1 auto"
      minWidth="0"
      gap={resolved<SpaceValue>(siteHeader.sizes.leadingGap)}
      {...props}
    />
  );
}

/** The end of the bar: it keeps its size, with the `siteHeader` trailing gap between its content. */
function HeaderTrailing(props: HeaderSlotProps) {
  const { siteHeader } = useTokens();
  return (
    <Box
      data-component="Header.Trailing"
      flexDirection="row"
      alignItems="center"
      flex="0 0 auto"
      minWidth="0"
      gap={resolved<SpaceValue>(siteHeader.sizes.trailingGap)}
      {...props}
    />
  );
}

export type HeaderDividerProps = Omit<React.ComponentPropsWithRef<"span">, "children" | "color">;

/** A vertical rule between controls in a slot (a back button and the breadcrumbs). Decorative. */
function HeaderDivider({ className, ...props }: HeaderDividerProps) {
  const { siteHeader } = useTokens();
  return (
    <Box
      as="span"
      {...mergeProps({ "data-component": "Header.Divider", className: clsx(classes.Divider, className), "aria-hidden": true }, props as object)}
      display="inline-block"
      flexShrink={0}
      width={resolved<Length>(siteHeader.sizes.dividerWidth)}
      height={resolved<Length>(siteHeader.sizes.dividerHeight)}
      backgroundColor={resolved<CssColor>(siteHeader.color.divider)}
    />
  );
}

export const Header = Object.assign(HeaderRoot, { Leading: HeaderLeading, Trailing: HeaderTrailing, Divider: HeaderDivider });
