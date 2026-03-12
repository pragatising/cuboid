import React, { useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { DataGridTheme } from "../../../theme/types";

export type IconButtonSize = "sm" | "md";
export type IconButtonVariant = "default" | "ghost" | "danger";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  /** The icon element (svg or any React node). Sized automatically by the theme. */
  icon: React.ReactNode;
  /** Required for accessibility — used as aria-label and native title */
  "aria-label": string;
  /** Override any theme tokens */
  theme?: DataGridTheme;
}

/**
 * Icon-only button. The icon is centered within a square hit area.
 *
 *  sm  → 24×24px outer, 16×16px icon
 *  md  → 32×32px outer, 20×20px icon
 *
 * Size values live in theme.components.iconButton — never hardcode here.
 */
export function IconButton({
  size = "md",
  variant = "default",
  icon,
  theme,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: IconButtonProps) {
  const tokens = useTheme(theme);
  const [hovered, setHovered] = useState(false);

  const { functional } = tokens.colors;
  const sz = tokens.components.iconButton[size];
  const active = hovered && !disabled;

  type VariantStyle = { background: string; border: string; color?: string };

  const variantMap: Record<IconButtonVariant, VariantStyle> = {
    default: {
      background: active ? functional.background.muted : functional.background.default,
      border: `${tokens.sizes.borderWidth.thin} solid ${functional.border.default}`,
    },
    ghost: {
      background: active ? functional.background.muted : "transparent",
      border: `${tokens.sizes.borderWidth.thin} solid transparent`,
    },
    danger: {
      background: active ? functional.danger.bgMuted : "transparent",
      border: `${tokens.sizes.borderWidth.thin} solid transparent`,
      color: functional.danger.fgOnSubtle,
    },
  };

  const vs = variantMap[variant];

  return (
    <button
      disabled={disabled}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: sz.size,
        height: sz.size,
        boxSizing: "border-box",
        padding: 0,
        borderRadius: tokens.sizes.borderRadius.md,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: functional.foreground.default,
        transition: "background-color 0.12s ease",
        outline: "none",
        flexShrink: 0,
        ...vs,
        ...style,
      }}
      {...rest}
    >
      {/* Explicit size wrapper ensures the SVG respects the icon size token */}
      <span
        style={{
          width: sz.iconSize,
          height: sz.iconSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {icon}
      </span>
    </button>
  );
}
