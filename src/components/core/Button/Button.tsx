import React, { useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { DataGridTheme } from "../../../theme/types";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** Icon placed before the label */
  leadingIcon?: React.ReactNode;
  /** Icon placed after the label */
  trailingIcon?: React.ReactNode;
  /** Override any theme tokens */
  theme?: DataGridTheme;
  children?: React.ReactNode;
}

/**
 * Button sizes (all heights use border-box):
 *
 *  sm  paddingX=7   paddingY=3   lineHeight=16  → 24px total
 *  md  paddingX=11  paddingY=5   lineHeight=20  → 32px total
 *  lg  paddingX=15  paddingY=9   lineHeight=20  → 40px total
 *
 * Size values live in theme.components.button — never hardcode here.
 */
export function Button({
  size = "md",
  variant = "primary",
  leadingIcon,
  trailingIcon,
  theme,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const tokens = useTheme(theme);
  const [hovered, setHovered] = useState(false);

  const { functional } = tokens.colors;
  const sz = tokens.components.button[size];

  type VariantStyle = {
    background: string;
    color: string;
    border: string;
    opacity?: number;
  };

  const active = hovered && !disabled;

  const variantMap: Record<ButtonVariant, VariantStyle> = {
    primary: {
      background: active ? functional.foreground.default : functional.background.emphasis,
      color: functional.foreground.onEmphasis,
      border: `${tokens.sizes.borderWidth.thin} solid transparent`,
    },
    secondary: {
      background: active ? functional.background.muted : functional.background.default,
      color: functional.foreground.default,
      border: `${tokens.sizes.borderWidth.thin} solid ${functional.border.default}`,
    },
    ghost: {
      background: active ? functional.background.muted : "transparent",
      color: functional.foreground.default,
      border: `${tokens.sizes.borderWidth.thin} solid transparent`,
    },
    danger: {
      background: active ? functional.danger.bgHover : functional.danger.bg,
      color: functional.danger.fg,
      border: `${tokens.sizes.borderWidth.thin} solid transparent`,
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
        gap: sz.iconGap,
        height: sz.height,
        paddingTop: sz.paddingY,
        paddingBottom: sz.paddingY,
        paddingLeft: sz.paddingX,
        paddingRight: sz.paddingX,
        boxSizing: "border-box",
        fontSize: sz.fontSize,
        lineHeight: sz.lineHeight,
        fontFamily: tokens.typography.fontFamily.base,
        fontWeight: tokens.typography.fontWeight.medium,
        borderRadius: tokens.sizes.borderRadius.md,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background-color 0.12s ease, opacity 0.12s ease",
        whiteSpace: "nowrap",
        textDecoration: "none",
        outline: "none",
        ...vs,
        ...style,
      }}
      {...rest}
    >
      {leadingIcon && (
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {leadingIcon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
