import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, ThemeTokens } from "../../../theme/types";
import styles from "./Button.module.css";

export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "rounded";
/** `rounded` = pill radius; use with any `variant`, or use `variant="rounded"` for Figma neutral pill. */
export type ButtonShape = "default" | "rounded";

type ControlStop = keyof ThemeTokens["sizes"]["control"];

const SIZE_TO_CONTROL: Record<ButtonSize, ControlStop> = {
  xs: "extraSmall",
  sm: "small",
  md: "medium",
  lg: "large",
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** Pill / stadium shape (Figma control `style: rounded`) */
  shape?: ButtonShape;
  /** If true, the button fills the container width */
  block?: boolean;
  /** Icon placed before the label */
  leadingIcon?: React.ReactNode;
  /** Icon placed after the label */
  trailingIcon?: React.ReactNode;
  /** Override any theme tokens */
  theme?: CubeTheme;
  children?: React.ReactNode;
}

function decorateIcon(icon: React.ReactNode) {
  if (!React.isValidElement(icon)) return icon;
  return React.cloneElement(icon as React.ReactElement<any>, {
    "aria-hidden": true,
    focusable: false,
    ...((icon as any).props ?? {}),
  });
}

export function Button({
  size = "sm",
  variant = "secondary",
  shape = "default",
  block = false,
  leadingIcon,
  trailingIcon,
  theme,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const tokens = useTheme(theme);
  const pill =
    shape === "rounded" || variant === "rounded";

  const className = [
    "cube-focusable",
    styles.Button,
    variant === "primary" && styles["Button--primary"],
    variant === "secondary" && styles["Button--secondary"],
    variant === "ghost" && styles["Button--ghost"],
    variant === "danger" && styles["Button--danger"],
    variant === "rounded" && styles["Button--rounded"],
    size === "xs" && styles["Button--size-xs"],
    size === "sm" && styles["Button--size-sm"],
    size === "md" && styles["Button--size-md"],
    size === "lg" && styles["Button--size-lg"],
    pill && styles["Button--shape-rounded"],
    block && styles["Button--block"],
    rest.className,
  ]
    .filter(Boolean)
    .join(" ");

  // Default theme: consume generated CSS vars on :root (no inline vars).
  // Local `theme` overrides: re-bind the same `--cube-*` names the module reads.
  const inlineVars = theme
    ? (() => {
        const { functional } = tokens.colors;
        const stop = SIZE_TO_CONTROL[size];
        const cssSeg = stop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
        const c = tokens.sizes.control[stop];
        const typo = tokens.typography.button[stop];

        const out: Record<string, string> = {
          [`--cube-control-${cssSeg}-gap`]: c.gap,
          [`--cube-control-${cssSeg}-size`]: c.size,
          [`--cube-control-${cssSeg}-borderRadius`]: c.borderRadius,
          [`--cube-control-${cssSeg}-icon`]: c.icon,
          [`--cube-control-${cssSeg}-paddingBlock`]: c.paddingBlock,
          [`--cube-control-${cssSeg}-paddingInline-condensed`]: c.paddingInline.condensed,
          [`--cube-control-${cssSeg}-paddingInline-normal`]: c.paddingInline.normal,
          [`--cube-control-${cssSeg}-paddingInline-spacious`]: c.paddingInline.spacious,
          [`--cube-typography-button-${cssSeg}-fontSize`]: typo.fontSize,
          [`--cube-typography-button-${cssSeg}-lineHeight`]: typo.lineHeight,
          "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
          "--cube-sizes-borderRadius-full": tokens.sizes.borderRadius.full,
          "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
        };

        const states = ["rest", "hover", "pressed", "disabled"] as const;
        for (const vKey of ["primary", "secondary", "ghost", "danger", "rounded"] as const) {
          const bv = functional.button[vKey];
          for (const s of states) {
            out[`--cube-button-${vKey}-bg-${s}`] = bv.bgColor[s];
            out[`--cube-button-${vKey}-fg-${s}`] = bv.fgColor[s];
            out[`--cube-button-${vKey}-border-${s}`] = bv.borderColor[s];
          }
        }

        return out as React.CSSProperties;
      })()
    : undefined;

  return (
    <button
      disabled={disabled}
      type={rest.type ?? "button"}
      className={className}
      style={{ ...(style ?? {}), ...(inlineVars ?? {}) }}
      {...rest}
    >
      {leadingIcon && (
        <span className={styles.Button__leadingVisual}>
          {decorateIcon(leadingIcon)}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span className={styles.Button__trailingVisual}>
          {decorateIcon(trailingIcon)}
        </span>
      )}
    </button>
  );
}
