import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { DataGridTheme, TextTokens } from "../../../theme/types";

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
  display:     "h1",
  titleLarge:  "h2",
  titleMedium: "h3",
  titleSmall:  "h4",
  subtitle:    "p",
  bodyLarge:   "p",
  bodyMedium:  "p",
  bodySmall:   "p",
  caption:     "span",
  codeBlock:   "pre",
  inlineCode:  "code",
};

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
  theme?: DataGridTheme;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Typography primitive. Renders semantic HTML with theme-driven text styles.
 * Never import raw font values in components — always go through <Text>.
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
  const { foreground } = tokens.colors.functional;
  const textStyle = tokens.typography.text[variant];

  const As = as ?? DEFAULT_ELEMENT[variant];

  const resolvedColor: string =
    color === "default"    ? foreground.default    :
    color === "muted"      ? foreground.muted      :
    color === "onEmphasis" ? foreground.onEmphasis :
    color === "disabled"   ? foreground.disabled   :
    color === "link"       ? foreground.link       :
    color === "white"      ? foreground.white      :
    color === "neutral"    ? foreground.neutral    :
    color; // raw CSS value

  return (
    <As
      className={className}
      style={{
        margin: 0,
        padding: 0,
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
        lineHeight: textStyle.lineHeight,
        fontFamily: textStyle.fontFamily ?? tokens.typography.fontFamily.base,
        color: resolvedColor,
        textAlign: align,
        ...(truncate && {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }),
        ...style,
      }}
    >
      {children}
    </As>
  );
}
