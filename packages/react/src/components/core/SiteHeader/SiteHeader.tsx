import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import styles from "./SiteHeader.module.css";

export interface SiteHeaderProps {
  /** Primary navigation region (menu, breadcrumbs, back affordances). */
  leading?: React.ReactNode;
  /** Actions region (search, notifications, primary buttons). */
  trailing?: React.ReactNode;
  theme?: CubeTheme;
  className?: string;
}

export function SiteHeader({ leading, trailing, theme, className }: SiteHeaderProps) {
  const tokens = useTheme(theme);

  const inlineVars = theme
    ? ({
        "--cube-siteHeader-bg": tokens.colors.functional.siteHeader.background,
        "--cube-siteHeader-border": tokens.colors.functional.siteHeader.border,
        "--cube-siteHeader-height": tokens.sizes.siteHeader.height,
        "--cube-siteHeader-paddingInlineStart": tokens.sizes.siteHeader.paddingInlineStart,
        "--cube-siteHeader-paddingInlineEnd": tokens.sizes.siteHeader.paddingInlineEnd,
        "--cube-siteHeader-paddingBlock": tokens.sizes.siteHeader.paddingBlock,
        "--cube-siteHeader-leadingGap": tokens.sizes.siteHeader.leadingGap,
        "--cube-siteHeader-trailingGap": tokens.sizes.siteHeader.trailingGap,
      } as React.CSSProperties)
    : undefined;

  return (
    <header
      className={[styles.SiteHeader, className].filter(Boolean).join(" ")}
      style={inlineVars}
    >
      {leading && <div className={styles.SiteHeader__leading}>{leading}</div>}
      {trailing && <div className={styles.SiteHeader__trailing}>{trailing}</div>}
    </header>
  );
}

export interface SiteHeaderDividerProps {
  theme?: CubeTheme;
  className?: string;
}

/** Vertical rule between leading controls (e.g. back button and breadcrumbs). */
export function SiteHeaderDivider({ theme, className }: SiteHeaderDividerProps) {
  const tokens = useTheme(theme);

  const inlineVars = theme
    ? ({
        "--cube-siteHeader-divider-fg": tokens.colors.functional.siteHeader.divider,
        "--cube-siteHeader-divider-height": tokens.sizes.siteHeader.dividerHeight,
        "--cube-siteHeader-divider-width": tokens.sizes.siteHeader.dividerWidth,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      className={[styles.SiteHeaderDivider, className].filter(Boolean).join(" ")}
      style={inlineVars}
      aria-hidden
    />
  );
}
