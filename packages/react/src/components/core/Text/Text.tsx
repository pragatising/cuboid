import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, FontWeightTokens, GlobalColorPath, TextTokens } from "../../../theme/types";
import styles from "./Text.module.css";

export const TEXT_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export type TextRole = "heading" | "body" | "subhead" | "code";
export type TextTokenKey = keyof TextTokens;

/** Theme font-weight token name or numeric step from `text.weight.*` */
export type TextWeight = keyof FontWeightTokens | 400 | 500 | 600 | 700;

const NUMERIC_WEIGHT_KEY: Record<400 | 500 | 600 | 700, keyof FontWeightTokens> = {
  400: "regular",
  500: "medium",
  600: "semibold",
  700: "bold",
};

function resolveTextWeight(
  weight: TextWeight | undefined,
  strong: boolean,
  fontWeight: FontWeightTokens,
): number | undefined {
  if (weight !== undefined) {
    if (typeof weight === "number") {
      const key = NUMERIC_WEIGHT_KEY[weight as 400 | 500 | 600 | 700];
      return key ? fontWeight[key] : weight;
    }
    return fontWeight[weight];
  }
  if (strong) return fontWeight.semibold;
  return undefined;
}

/** @deprecated Use global paths — e.g. `text.muted` instead of `"muted"`. */
export type TextColor = GlobalColorPath;

function capitalize(size: string) {
  return size.charAt(0).toUpperCase() + size.slice(1);
}

function tokenKeyToCssClass(key: TextTokenKey): string {
  const seg = key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
  return styles[`Text--${seg}`];
}

function textTokenKeyToCssSeg(key: TextTokenKey): string {
  return key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

export function resolveTextTokenKey(
  role: TextRole,
  size: TextSize,
  code: "block" | "inline" = "inline",
): TextTokenKey {
  if (role === "code") return code === "block" ? "codeBlock" : "inlineCode";
  if (role === "subhead") return `subhead${capitalize(size)}` as TextTokenKey;
  return `${role}${capitalize(size)}` as TextTokenKey;
}

function defaultSizeForRole(role: TextRole): TextSize {
  if (role === "body") return "sm";
  if (role === "code") return "sm";
  return "md";
}

const HEADING_ELEMENT: Record<TextSize, React.ElementType> = {
  xl: "h1",
  lg: "h2",
  md: "h3",
  sm: "h4",
  xs: "h5",
};

function defaultElement(role: TextRole, size: TextSize, code: "block" | "inline"): React.ElementType {
  if (role === "code") return code === "block" ? "pre" : "code";
  if (role === "heading") return HEADING_ELEMENT[size];
  if (role === "subhead") return "span";
  return "p";
}

/** Default foreground per role — heading/subhead read darker than body. */
export function defaultColorForRole(role: TextRole): GlobalColorPath {
  if (role === "heading" || role === "subhead") return "text.contrast";
  return "fg.neutral.muted";
}

export interface TextProps {
  /** Override the default HTML element */
  as?: React.ElementType;
  /** heading → `heading.weight.600`; body → `text.weight.400` (both use `text.sizes`) */
  role?: TextRole;
  /** Size step from `text.sizes` (xs–xl) */
  size?: TextSize;
  /** When `role="code"`, block vs inline metrics */
  code?: "block" | "inline";
  /**
   * Override role default weight from `typography.fontWeight` / `text.weight.*`.
   * @example weight="medium" | weight={500} | weight="semibold"
   */
  weight?: TextWeight;
  /** @deprecated Use `weight="semibold"` */
  strong?: boolean;
  /**
   * Color from `colors.global` (dot-path), or any raw CSS color string.
   * @default heading/subhead → `text.contrast`; body/code → `fg.neutral.muted`
   */
  color?: GlobalColorPath;
  align?: CSSProperties["textAlign"];
  truncate?: boolean;
  theme?: CubeTheme;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Typography primitive. Metrics are generated from typography.json:
 * heading → text.sizes + heading.weight/lineHeight; body → text.sizes + text.weight/lineHeight.
 */
export function Text({
  as,
  role = "body",
  size,
  code = "inline",
  weight,
  strong = false,
  color,
  align,
  truncate = false,
  theme,
  style,
  className,
  children,
}: TextProps) {
  const tokens = useTheme(theme);
  const resolvedSize = size ?? defaultSizeForRole(role);
  const tokenKey = resolveTextTokenKey(role, resolvedSize, code);
  const As = as ?? defaultElement(role, resolvedSize, code);

  const classNames = [
    styles.Text,
    tokenKeyToCssClass(tokenKey),
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
        (Object.keys(tokens.typography.text) as TextTokenKey[]).forEach((key) => {
          const seg = textTokenKeyToCssSeg(key);
          const st = tokens.typography.text[key];
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

  const resolvedColor = resolveGlobalColorOrCss(
    color ?? defaultColorForRole(role),
    tokens.colors.global,
    {
    default: "fg.neutral.muted",
    muted: "text.muted",
    onEmphasis: "fg.neutral.inverted",
    disabled: "text.disabled",
    link: "fg.link.default",
    white: "fg.neutral.inverted",
    neutral: "fg.neutral.default",
    },
  );

  const resolvedWeight = resolveTextWeight(weight, strong, tokens.typography.fontWeight);

  return (
    <As
      className={classNames}
      style={{
        textAlign: align,
        color: resolvedColor,
        fontWeight: resolvedWeight,
        ...inlineVars,
        ...style,
      }}
    >
      {children}
    </As>
  );
}
