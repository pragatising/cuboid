import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, GlobalColorPath } from "../../../theme/types";
import { Stack } from "../Stack";
import styles from "./Callout.module.css";

export type { GlobalColorPath as CalloutBackground };

export interface CalloutProps {
  /**
   * Surface color from `colors.global` (dot-path), or any CSS color string.
   * @default "canvas.inset"
   * @example "canvas.inset" | "bg.gray.light.2" | "#eef6ff"
   */
  background?: GlobalColorPath;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function calloutCssVars(
  background: GlobalColorPath,
  tokens: ReturnType<typeof useTheme>,
): Record<string, string> {
  return {
    "--callout-bg": resolveGlobalColorOrCss(background, tokens.colors.global),
  };
}

/** Inset block for blockquotes, notes, and asides. */
export function Callout({
  background = "canvas.inset",
  theme,
  className,
  style,
  children,
}: CalloutProps) {
  const tokens = useTheme(theme);

  return (
    <Stack
      padding="sm"
      className={[styles.Callout, className].filter(Boolean).join(" ")}
      style={{ ...calloutCssVars(background, tokens), ...style }}
    >
      {children}
    </Stack>
  );
}
