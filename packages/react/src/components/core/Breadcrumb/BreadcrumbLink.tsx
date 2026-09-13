import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { BreadcrumbFunctionalColors, CubeTheme } from "../../../theme/types";
import styles from "./BreadcrumbLink.module.css";

export type BreadcrumbLinkState = "rest" | "hover" | "active";

export interface BreadcrumbLinkProps {
  href?: string;
  /** Current page — renders as non-interactive text (maps to Figma `active`). */
  current?: boolean;
  theme?: CubeTheme;
  className?: string;
  children: React.ReactNode;
}

function breadcrumbCssVars(breadcrumb: BreadcrumbFunctionalColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const state of ["rest", "hover", "active"] as const) {
    out[`--cube-breadcrumb-link-bg-${state}`] = breadcrumb.link.bgColor[state];
    out[`--cube-breadcrumb-link-fg-${state}`] = breadcrumb.link.fgColor[state];
  }
  return out;
}

export function BreadcrumbLink({
  href,
  current = false,
  theme,
  className,
  children,
  ...rest
}: BreadcrumbLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children">) {
  const tokens = useTheme(theme);
  const isCurrent = current || !href;

  const classNames = [
    styles.BreadcrumbLink,
    isCurrent ? styles["BreadcrumbLink--active"] : styles["BreadcrumbLink--link"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? ({
        ...breadcrumbCssVars(tokens.colors.functional.breadcrumb),
        "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
        "--cube-typography-text-body-sm-fontSize":
          tokens.typography.text.bodySm.fontSize,
        "--cube-typography-text-body-sm-lineHeight": String(
          tokens.typography.text.bodySm.lineHeight
        ),
        "--cube-breadcrumb-item-paddingInline": tokens.sizes.breadcrumb.itemPaddingInline,
        "--cube-breadcrumb-item-paddingBlock": tokens.sizes.breadcrumb.itemPaddingBlock,
        "--cube-breadcrumb-item-borderRadius": tokens.sizes.breadcrumb.itemBorderRadius,
      } as React.CSSProperties)
    : undefined;

  if (isCurrent) {
    return (
      <span
        className={classNames}
        style={inlineVars}
        aria-current="page"
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    );
  }

  return (
    <a className={["cube-focusable", classNames].filter(Boolean).join(" ")} style={inlineVars} href={href} {...rest}>
      {children}
    </a>
  );
}
