import React from "react";
import type { CubeTheme } from "../../../theme/types";
import styles from "./SplitLayout.module.css";

export interface SplitLayoutProps {
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface SplitLayoutMainProps {
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function SplitLayoutMain({ className, style, children }: SplitLayoutMainProps) {
  return (
    <main
      className={[styles.SplitLayout__main, className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </main>
  );
}

/**
 * Horizontal app shell — sidebar (or other leading panel) plus scrollable main.
 * In-flow only; pair with {@link Sidebar} rather than portaled {@link Sheet}.
 */
export function SplitLayout({ className, style, children }: SplitLayoutProps) {
  return (
    <div className={[styles.SplitLayout, className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  );
}

SplitLayout.Main = SplitLayoutMain;
