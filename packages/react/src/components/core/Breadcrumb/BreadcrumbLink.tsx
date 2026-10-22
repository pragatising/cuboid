import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./BreadcrumbLink.module.css";

export type BreadcrumbLinkProps = Omit<React.ComponentPropsWithRef<"a">, "children"> & {
  /** Current page: renders as non-interactive text, not a link. Also the case when there is no `href`. @default false */
  current?: boolean;
  children: React.ReactNode;
};

/** One item of a breadcrumb trail: a link, or (for the current page) plain text with `aria-current="page"`. */
export function BreadcrumbLink({ href, current = false, className, children, ref, ...props }: BreadcrumbLinkProps) {
  const { breadcrumb, text, focusRing } = useTokens();
  const isCurrent = current || !href;

  const shared = {
    "data-component": "BreadcrumbLink",
    "data-current": isCurrent ? "" : undefined,
    className: clsx(classes.BreadcrumbLink, className),
    style: {
      font: text.size.md,
      paddingBlock: breadcrumb.sizes.itemPaddingBlock,
      paddingInline: breadcrumb.sizes.itemPaddingInline,
      borderRadius: breadcrumb.sizes.itemBorderRadius,
      ...cssVars("breadcrumb", {
        fg: breadcrumb.link.fgColor,
        bg: breadcrumb.link.bgColor,
        focusColor: focusRing.color,
        focusWidth: focusRing.width,
        focusOffset: focusRing.offset,
      }),
    },
  };

  if (isCurrent) {
    return (
      <span {...mergeProps({ ...shared, "aria-current": "page" as const }, props as React.ComponentPropsWithRef<"span">)} ref={ref as React.Ref<HTMLSpanElement>}>
        {children}
      </span>
    );
  }

  return (
    <a {...mergeProps(shared, props)} href={href} ref={ref}>
      {children}
    </a>
  );
}
