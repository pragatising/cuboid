import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./SiteHeader.module.css";

export type SiteHeaderProps = Omit<React.ComponentPropsWithRef<"header">, "children"> & {
  /** Primary navigation region (menu, breadcrumbs, back affordances). */
  leading?: React.ReactNode;
  /** Actions region (search, notifications, primary buttons). */
  trailing?: React.ReactNode;
};

/** The shell of a page header: pass app-specific content through `leading` and `trailing`. Its look comes from the `siteHeader` tokens. */
export function SiteHeader({ leading, trailing, className, ...props }: SiteHeaderProps) {
  const { siteHeader, borderWidth } = useTokens();
  const { color, sizes } = siteHeader;

  return (
    <header
      {...mergeProps(
        {
          "data-component": "SiteHeader",
          className: clsx(classes.SiteHeader, className),
          style: {
            minHeight: sizes.height,
            paddingBlock: sizes.paddingBlock,
            paddingInlineStart: sizes.paddingInlineStart,
            paddingInlineEnd: sizes.paddingInlineEnd,
            backgroundColor: color.background,
            borderBottomWidth: borderWidth.thin,
            borderBottomColor: color.border,
          },
        },
        props,
      )}
    >
      {leading && (
        <div data-component="SiteHeader.Leading" className={classes.Leading} style={{ gap: sizes.leadingGap }}>
          {leading}
        </div>
      )}
      {trailing && (
        <div data-component="SiteHeader.Trailing" className={classes.Trailing} style={{ gap: sizes.trailingGap }}>
          {trailing}
        </div>
      )}
    </header>
  );
}

export type SiteHeaderDividerProps = Omit<React.ComponentPropsWithRef<"span">, "children">;

/** Vertical rule between leading controls (e.g. back button and breadcrumbs). */
export function SiteHeaderDivider({ className, ...props }: SiteHeaderDividerProps) {
  const { siteHeader } = useTokens();

  return (
    <span
      {...mergeProps(
        {
          "data-component": "SiteHeaderDivider",
          className: clsx(classes.Divider, className),
          style: {
            width: siteHeader.sizes.dividerWidth,
            height: siteHeader.sizes.dividerHeight,
            backgroundColor: siteHeader.color.divider,
          },
          "aria-hidden": true,
        },
        props,
      )}
    />
  );
}
