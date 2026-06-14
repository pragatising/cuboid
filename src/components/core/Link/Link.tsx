import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, LinkFunctionalColors, ThemeTokens } from "../../../theme/types";
import { Icon } from "../Icon";
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

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <path d="M3.75 3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-4a.75.75 0 0 1 1.5 0v4A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2h4a.75.75 0 0 1 0 1.5h-4Z" />
    <path d="M12.5 2a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V3.56L9.78 8.03a.75.75 0 0 1-1.06-1.06l4.47-4.47H13a.75.75 0 0 1-.5-1.5Z" />
  </svg>
);

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
          <ExternalIcon />
        </Icon>
      )}
    </a>
  );
}
