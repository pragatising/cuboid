import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import { Stack } from "../Stack";
import styles from "./Callout.module.css";

export interface CalloutProps {
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Inset block for blockquotes, notes, and asides. */
export function Callout({ theme, className, style, children }: CalloutProps) {
  useTheme(theme);

  return (
    <Stack
      padding="sm"
      className={[styles.Callout, className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </Stack>
  );
}
