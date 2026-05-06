import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, TextTokens } from "../../../theme/types";
import styles from "./Text.module.css";

export type TextVariant = keyof TextTokens;

/** Shorthand names for functional foreground tokens */
export type TextColor =
  | "default"
  | "muted"
  | "onEmphasis"
  | "disabled"
  | "link"
  | "white"
  | "neutral";

/** Default HTML element for each text variant */
const DEFAULT_ELEMENT: Record<TextVariant, React.ElementType> = {
  display: "h1",
  titleLarge: "h2",
  titleMedium: "h3",
  titleSmall: "h4",
  subtitle: "p",
  bodyLarge: "p",
  bodyMedium: "p",
  bodySmall: "p",
  caption: "span",
  codeBlock: "pre",
  inlineCode: "code",
};

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: styles["Text--display"],
  titleLarge: styles["Text--title-large"],
  titleMedium: styles["Text--title-medium"],
  titleSmall: styles["Text--title-small"],
  subtitle: styles["Text--subtitle"],
  bodyLarge: styles["Text--body-large"],
  bodyMedium: styles["Text--body-medium"],
  bodySmall: styles["Text--body-small"],
  caption: styles["Text--caption"],
  codeBlock: styles["Text--code-block"],
  inlineCode: styles["Text--inline-code"],
};

const COLOR_CLASS: Record<TextColor, string> = {
  default: styles["Text--color-default"],
  muted: styles["Text--color-muted"],
  onEmphasis: styles["Text--color-on-emphasis"],
  disabled: styles["Text--color-disabled"],
  link: styles["Text--color-link"],
  white: styles["Text--color-white"],
  neutral: styles["Text--color-neutral"],
};

const SEMANTIC_COLORS = new Set<TextColor>([
  "default",
  "muted",
  "onEmphasis",
  "disabled",
  "link",
  "white",
  "neutral",
]);

function isSemanticTextColor(c: string): c is TextColor {
  return SEMANTIC_COLORS.has(c as TextColor);
}

function textVariantToCssSeg(v: TextVariant): string {
  return v.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

export interface TextProps {
  /** Override the default HTML element for this variant */
  as?: React.ElementType;
  /** Maps to a named text style from the theme */
  variant?: TextVariant;
  /**
   * Functional foreground color name, or any raw CSS color string.
   * @example "muted"       → theme.colors.functional.foreground.muted
   * @example "#ff0000"     → used as-is
   */
  color?: TextColor | string;
  align?: CSSProperties["textAlign"];
  /** Truncate with ellipsis on a single line */
  truncate?: boolean;
  /** Override any theme tokens */
  theme?: CubeTheme;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Typography primitive. Styles come from generated theme CSS variables (`--cube-typography-text-*`).
 */
export function Text({
  as,
  variant = "bodyMedium",
  color = "default",
  align,
  truncate = false,
  theme,
  style,
  className,
  children,
}: TextProps) {
  const tokens = useTheme(theme);
  const As = as ?? DEFAULT_ELEMENT[variant];

  const semanticColor = typeof color === "string" && isSemanticTextColor(color);

  const classNames = [
    styles.Text,
    VARIANT_CLASS[variant],
    semanticColor && COLOR_CLASS[color],
    truncate && styles["Text--truncate"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? (() => {
        const fg = tokens.colors.functional.foreground;
        const out: Record<string, string> = {
          "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
          "--cube-typography-fontFamily-mono": tokens.typography.fontFamily.mono,
          "--cube-colors-functional-foreground-default": fg.default,
          "--cube-colors-functional-foreground-muted": fg.muted,
          "--cube-colors-functional-foreground-onEmphasis": fg.onEmphasis,
          "--cube-colors-functional-foreground-disabled": fg.disabled,
          "--cube-colors-functional-foreground-link": fg.link,
          "--cube-colors-functional-foreground-white": fg.white,
          "--cube-colors-functional-foreground-neutral": fg.neutral,
        };
        (Object.keys(tokens.typography.text) as TextVariant[]).forEach((v) => {
          const seg = textVariantToCssSeg(v);
          const st = tokens.typography.text[v];
          out[`--cube-typography-text-${seg}-fontSize`] = st.fontSize;
          out[`--cube-typography-text-${seg}-fontWeight`] = String(st.fontWeight);
          out[`--cube-typography-text-${seg}-lineHeight`] = String(st.lineHeight);
          if (st.fontFamily) {
            out[`--cube-typography-text-${seg}-fontFamily`] = st.fontFamily;
          }
        });
        return out as React.CSSProperties;
      })()
    : undefined;

  return (
    <As
      className={classNames}
      style={{
        textAlign: align,
        ...inlineVars,
        ...(!semanticColor && typeof color === "string" ? { color } : undefined),
        ...style,
      }}
    >
      {children}
    </As>
  );
}
