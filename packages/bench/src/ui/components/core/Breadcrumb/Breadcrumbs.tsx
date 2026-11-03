import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { BreadcrumbLink } from "./BreadcrumbLink";
import classes from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type BreadcrumbsProps = Omit<React.ComponentPropsWithRef<"nav">, "children"> & {
  /** The trail, root first. The last item (or any without an `href`) is the current page. */
  items: BreadcrumbItem[];
};

/** A navigation trail. Spacing and the separator come from the `breadcrumb` tokens. */
export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  const { breadcrumb, text } = useTokens();
  if (items.length === 0) return null;

  return (
    <nav
      {...mergeProps(
        { "data-component": "Breadcrumbs", "aria-label": "Breadcrumb", className: clsx(classes.Breadcrumbs, className) },
        props,
      )}
    >
      <ol className={classes.List} style={{ gap: breadcrumb.sizes.gap }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={classes.Item} style={{ gap: breadcrumb.sizes.gap }}>
              <BreadcrumbLink href={item.href} current={isLast || !item.href}>
                {item.label}
              </BreadcrumbLink>
              {!isLast && (
                <span
                  className={classes.Separator}
                  aria-hidden
                  style={{ width: breadcrumb.sizes.separatorWidth, font: text.size.md, color: breadcrumb.separator.fgColor }}
                >
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
