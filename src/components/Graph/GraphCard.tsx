import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { CardContext } from "./context";

export interface GraphCardProps {
  /** Unique identifier — used to build handle keys ("id:handleId"). */
  id: string;
  /** Position in canvas space (pixels, before zoom). */
  x: number;
  y: number;
  /** Minimum card width. Content can make it wider. */
  minWidth?: number;
  children?: React.ReactNode;
  /**
   * Override any visual default (background, border, padding, gap …).
   * Merged on top of theme defaults so partial overrides work naturally.
   */
  style?: CSSProperties;
  className?: string;
}

/**
 * A positioned, theme-styled container in the graph canvas.
 *
 * Visual defaults (background, border, shadow, padding, gap, border-radius)
 * come from the active theme so the card looks good out of the box. Override
 * any of them via the `style` prop, or swap the whole theme via `ThemeProvider`.
 *
 * Provides `CardContext` so any nested `GraphHandle` knows which card it
 * belongs to when registering its canvas-space position.
 *
 * `overflow: visible` is intentional — handle dots extend beyond the card
 * boundary and must not be clipped.
 */
export function GraphCard({
  id,
  x,
  y,
  minWidth = 220,
  children,
  style,
  className,
}: GraphCardProps) {
  const tokens = useTheme();

  return (
    <CardContext.Provider value={{ cardId: id }}>
      <div
        className={className}
        style={{
          // ── Canvas positioning ──────────────────────────────────────────────
          position: "absolute",
          left: x,
          top: y,
          minWidth,

          // ── Visual defaults from theme ──────────────────────────────────────
          background:    tokens.colors.functional.background.default,
          border:        `${tokens.sizes.borderWidth.thin} solid ${tokens.colors.functional.border.muted}`,
          borderRadius:  tokens.sizes.borderRadius.lg,          // 8px
          boxShadow:     "none",

          // ── Layout ─────────────────────────────────────────────────────────
          overflow:      "visible",                             // handles must not be clipped
          padding:       tokens.sizes.space[3],                 // 12px all around
          display:       "flex",
          flexDirection: "column",
          gap:           tokens.sizes.space[1],                 // 4px between rows

          // Consumer overrides come last
          ...style,
        }}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}
