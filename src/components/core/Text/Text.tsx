import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, GlobalColorPath, TextTokens } from "../../../theme/types";
import styles from "./Text.module.css";

export type TextVariant = keyof TextTokens;

/** @deprecated Use global paths — e.g. `text.muted` instead of `"muted"`. */
export type TextColor = GlobalColorPath;

/** Default HTML element for each text variant */
const DEFAULT_ELEMENT: Record<TextVariant, React.ElementType> = {
  display: "h1",
  titleLarge: "h2",
  titleMedium: "h3",
  titleSmall: "h4",
  subtitle: "p",
  subheadXs: "span",
  subheadSm: "span",
  subheadMd: "span",
  bodyLarge: "p",
  bodyMedium: "p",
  bodyStrong: "p",
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
  subheadXs: styles["Text--subhead-xs"],
  subheadSm: styles["Text--subhead-sm"],
  subheadMd: styles["Text--subhead-md"],
  bodyLarge: styles["Text--body-large"],
  bodyMedium: styles["Text--body-medium"],
  bodyStrong: styles["Text--body-strong"],
  bodySmall: styles["Text--body-small"],
  caption: styles["Text--caption"],
  codeBlock: styles["Text--code-block"],
  inlineCode: styles["Text--inline-code"],
};

function textVariantToCssSeg(v: TextVariant): string {
  return v.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

export interface TextProps {
  /** Override the default HTML element for this variant */
  as?: React.ElementType;
  /** Maps to a named text style from the theme */
  variant?: TextVariant;
  /**
   * Color from `colors.global` (dot-path), or any raw CSS color string.
   * @default "fg.neutral.muted"
   * @example "text.muted" | "fg.blue.contrast" | "#ff0000"
   */
  color?: GlobalColorPath;
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
  color = "fg.neutral.muted",
  align,
  truncate = false,
  theme,
  style,
  className,
  children,
}: TextProps) {
  const tokens = useTheme(theme);
  const As = as ?? DEFAULT_ELEMENT[variant];

  const classNames = [
    styles.Text,
    VARIANT_CLASS[variant],
    truncate && styles["Text--truncate"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme
    ? (() => {
        const out: Record<string, string> = {
          "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
          "--cube-typography-fontFamily-mono": tokens.typography.fontFamily.mono,
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

  const resolvedColor = resolveGlobalColorOrCss(color, tokens.colors.global, {
    default: "fg.neutral.muted",
    muted: "text.muted",
    onEmphasis: "fg.neutral.inverted",
    disabled: "text.disabled",
    link: "fg.link.default",
    white: "fg.neutral.inverted",
    neutral: "fg.neutral.default",
  });

  return (
    <As
      className={classNames}
      style={{
        textAlign: align,
        color: resolvedColor,
        ...inlineVars,
        ...style,
      }}
    >
      {children}
    </As>
  );
}
