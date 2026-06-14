import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, LayoutWidth, StackPadding } from "../../../theme/types";
import { Stack } from "../Stack";
import styles from "./Container.module.css";

export type ContainerWidth = Extract<LayoutWidth, "page" | "content" | "full">;

export interface ContainerProps {
  as?: React.ElementType;
  /** Max content width — `page` (site shell) or `content` (reading column). */
  width?: ContainerWidth;
  /** Center horizontally with `margin-inline: auto`. Default true. */
  center?: boolean;
  /** Inline padding — defaults to layout `pagePaddingInline` token. */
  paddingInline?: StackPadding | false;
  /** Minimum block size — `screen` sets `min-height: 100svh`. */
  minHeight?: "screen";
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function containerCssVars(
  width: ContainerWidth,
  paddingInline: StackPadding | false | undefined,
  layout: {
    pageMaxWidth: string;
    contentMaxWidth: string;
    pagePaddingInline: string;
  },
  center: boolean
): Record<string, string> {
  const maxWidth =
    width === "page"
      ? layout.pageMaxWidth
      : width === "content"
        ? layout.contentMaxWidth
        : "100%";

  const pad =
    paddingInline === false
      ? "0"
      : paddingInline
        ? `var(--cube-stack-padding-${paddingInline})`
        : layout.pagePaddingInline;

  return {
    "--container-maxWidth": maxWidth,
    "--container-paddingInline": pad,
    "--container-marginInline": center ? "auto" : "0",
  };
}

/**
 * Page shell — max-width, horizontal padding, and optional vertical fill.
 * Replaces ad-hoc `#root` / layout wrapper CSS in consuming apps.
 */
export function Container({
  as = "div",
  width = "page",
  center = true,
  paddingInline,
  minHeight,
  theme,
  className,
  style,
  children,
}: ContainerProps) {
  const tokens = useTheme(theme);

  const classNames = [styles.Container, className].filter(Boolean).join(" ");

  return (
    <Stack
      as={as}
      gap="none"
      className={classNames}
      style={{
        ...containerCssVars(width, paddingInline, tokens.sizes.layout, center),
        ...(minHeight === "screen" ? { minHeight: "100svh" } : undefined),
        ...style,
      }}
    >
      {children}
    </Stack>
  );
}
