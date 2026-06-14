import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, LinkFunctionalColors, ThemeTokens } from "../../../theme/types";
import { Icon } from "../Icon";
import { OpenInNewIcon } from "../../../icons/material";
import styles from "./Link.module.css";

export type LinkVariant = keyof LinkFunctionalColors;

function linkCssVars(link: LinkFunctionalColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const variant of ["inline", "standalone"] as const) {
    const fg = link[variant];
    out[`--cube-link-${variant}-fg-rest`] = fg.rest;
    out[`--cube-link-${variant}-fg-hover`] = fg.hover;
  }
  return out;
}

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  href: string;
  /**
   * `inline` — inside body copy; inherits font from parent.
   * `standalone` — nav, footer, contact rows.
   */
  variant?: LinkVariant;
  /** Opens in a new tab with `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Show ↗ icon when `external` (default true). */
  showExternalIcon?: boolean;
  theme?: CubeTheme;
  children: React.ReactNode;
}

export function Link({
  href,
  variant = "standalone",
  external = false,
  showExternalIcon = true,
  theme,
  children,
  className,
  target,
  rel,
  ...rest
}: LinkProps) {
  const tokens = useTheme(theme);

  const classNames = [
    styles.Link,
    variant === "inline" ? styles["Link--inline"] : styles["Link--standalone"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? (() => {
        const { functional } = tokens.colors;
        const body = tokens.typography.text.bodyMedium;
        return {
          ...linkCssVars(functional.link),
          "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
          "--cube-typography-text-body-medium-fontSize": body.fontSize,
          "--cube-typography-text-body-medium-fontWeight": String(body.fontWeight),
          "--cube-typography-text-body-medium-lineHeight": String(body.lineHeight),
          "--cube-colors-functional-foreground-link": functional.foreground.link,
        } as React.CSSProperties;
      })()
    : undefined;

  const resolvedTarget = external ? "_blank" : target;
  const resolvedRel = external
    ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ")
    : rel;

  return (
    <a
      href={href}
      className={classNames}
      style={inlineVars}
      target={resolvedTarget}
      rel={resolvedRel}
      {...rest}
    >
      {children}
      {external && showExternalIcon && (
        <Icon size="xs" className={styles.Link__externalIcon}>
          <OpenInNewIcon />
        </Icon>
      )}
    </a>
  );
}
