import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import { BreadcrumbLink } from "./BreadcrumbLink";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Accessible label for the navigation landmark. */
  "aria-label"?: string;
  theme?: CubeTheme;
  className?: string;
}

export function Breadcrumbs({
  items,
  "aria-label": ariaLabel = "Breadcrumb",
  theme,
  className,
}: BreadcrumbsProps) {
  const tokens = useTheme(theme);

  if (items.length === 0) return null;

  const inlineVars = theme
    ? ({
        "--cube-breadcrumb-gap": tokens.sizes.breadcrumb.gap,
        "--cube-breadcrumb-separator-width": tokens.sizes.breadcrumb.separatorWidth,
        "--cube-breadcrumb-separator-fg": tokens.colors.functional.breadcrumb.separator.fgColor,
        "--cube-typography-text-body-medium-fontSize":
          tokens.typography.text.bodyMedium.fontSize,
        "--cube-typography-text-body-medium-lineHeight": String(
          tokens.typography.text.bodyMedium.lineHeight
        ),
      } as React.CSSProperties)
    : undefined;

  return (
    <nav className={[styles.Breadcrumbs, className].filter(Boolean).join(" ")} aria-label={ariaLabel} style={inlineVars}>
      <ol className={styles.Breadcrumbs__list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = isLast || !item.href;

          return (
            <li key={`${item.label}-${index}`} className={styles.Breadcrumbs__item}>
              <BreadcrumbLink href={item.href} current={isCurrent} theme={theme}>
                {item.label}
              </BreadcrumbLink>
              {!isLast && (
                <span className={styles.Breadcrumbs__separator} aria-hidden>
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
