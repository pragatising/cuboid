import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, LinkFunctionalColors, ThemeTokens } from "../../../theme/types";
import { Icon } from "../Icon";
import { OpenInNewIcon } from "../../../icons/material";
import styles from "./Link.module.css";

export type LinkVariant = keyof LinkFunctionalColors | "inherit";

type LinkOwnProps = {
  /**
   * `inline` — inside body copy; inherits font from parent.
   * `standalone` — nav, footer, contact rows.
   * `inherit` — composition wrapper (e.g. pill links); no underline, inherits color.
   */
  variant?: LinkVariant;
  /** Opens in a new tab with `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Show ↗ icon when `external` (default true). */
  showExternalIcon?: boolean;
  theme?: CubeTheme;
  className?: string;
  children: React.ReactNode;
};

export type LinkProps<E extends React.ElementType = "a"> = LinkOwnProps &
  Omit<React.ComponentPropsWithoutRef<E>, keyof LinkOwnProps | "as"> & {
    as?: E;
  };

function linkCssVars(link: LinkFunctionalColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const variant of ["inline", "standalone"] as const) {
    const fg = link[variant];
    out[`--cube-link-${variant}-fg-rest`] = fg.rest;
    out[`--cube-link-${variant}-fg-hover`] = fg.hover;
  }
  return out;
}

function linkInlineVars(tokens: ThemeTokens): React.CSSProperties {
  const { functional } = tokens.colors;
  const body = tokens.typography.text.bodySm;
  return {
    ...linkCssVars(functional.link),
    "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
    "--cube-typography-text-body-sm-fontSize": body.fontSize,
    "--cube-typography-text-body-sm-fontWeight": String(body.fontWeight),
    "--cube-typography-text-body-sm-lineHeight": String(body.lineHeight),
  } as React.CSSProperties;
}

export function Link<E extends React.ElementType = "a">({
  as,
  href,
  variant = "standalone",
  external = false,
  showExternalIcon = true,
  theme,
  children,
  className,
  target,
  rel,
  style,
  ...rest
}: LinkProps<E>) {
  const tokens = useTheme(theme);
  const Component = as ?? "a";

  const classNames = [
    "cube-focusable",
    styles.Link,
    variant === "inline" && styles["Link--inline"],
    variant === "standalone" && styles["Link--standalone"],
    variant === "inherit" && styles["Link--inherit"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme ? linkInlineVars(tokens) : undefined;

  const resolvedTarget = external && Component === "a" ? "_blank" : target;
  const resolvedRel =
    external && Component === "a"
      ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ")
      : rel;

  const componentProps = {
    className: classNames,
    style: { ...inlineVars, ...style },
    ...(Component === "a" ? { href, target: resolvedTarget, rel: resolvedRel } : {}),
    ...rest,
  } as React.ComponentPropsWithoutRef<E>;

  return (
    <Component {...componentProps}>
      {children}
      {external && showExternalIcon && variant !== "inherit" && (
        <Icon size="xs" className={styles.Link__externalIcon}>
          <OpenInNewIcon />
        </Icon>
      )}
    </Component>
  );
}
