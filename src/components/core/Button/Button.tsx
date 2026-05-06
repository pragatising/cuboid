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
  onMouseDown,
  onMouseUp,
  ...rest
}: ButtonProps) {
  const tokens = useTheme(theme);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const { functional } = tokens.colors;
  const sz = tokens.components.button[size];
  const thin = tokens.sizes.borderWidth.thin;

  type VariantStyle = {
    background: string;
    color: string;
    border: string;
    opacity?: number;
  };

  const primary = functional.button.primary;
  const secondary = functional.button.secondary;
  const primaryState = disabled
    ? "disabled"
    : pressed
      ? "pressed"
      : hovered
        ? "hover"
        : "rest";
  const secondaryState = primaryState;

  const variantMap: Record<ButtonVariant, VariantStyle> = {
    primary: {
      background: primary.bgColor[primaryState],
      color: primary.fgColor[primaryState],
      border: `${thin} solid ${primary.borderColor[primaryState]}`,
    },
    secondary: {
      background: secondary.bgColor[secondaryState],
      color: secondary.fgColor[secondaryState],
      border: `${thin} solid ${secondary.borderColor[secondaryState]}`,
    },
    ghost: {
      background: hovered && !disabled ? functional.background.muted : "transparent",
      color: functional.foreground.default,
      border: `${thin} solid transparent`,
    },
    danger: {
      background: hovered && !disabled ? functional.danger.bgHover : functional.danger.bg,
      color: functional.danger.fg,
      border: `${thin} solid transparent`,
    },
  };

  const vs = variantMap[variant];

  return (
    <button
      disabled={disabled}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); onMouseLeave?.(e); }}
      onMouseDown={(e) => {
        if (!disabled) setPressed(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setPressed(false);
        onMouseUp?.(e);
      }}
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
        opacity: disabled && variant !== "primary" ? 0.5 : 1,
        transition:
          "background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease, opacity 0.12s ease",
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
