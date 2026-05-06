// ── Utility ──────────────────────────────────────────────────────────────────

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ── Base color scale ──────────────────────────────────────────────────────────

export interface ColorScale {
  0: string; 1: string; 2: string; 3: string; 4: string;
  5: string; 6: string; 7: string; 8: string; 9: string;
}

export interface BaseColors {
  gray: ColorScale;
  blue: ColorScale;
  green: ColorScale;
  red: ColorScale;
  orange: ColorScale;
  purple: ColorScale;
}

// ── Functional: backgrounds ──────────────────────────────────────────────────

export interface BackgroundColors {
  default: string;
  muted: string;
  inset: string;
  emphasis: string;
  disabled: string;
  transparent: string;
  inverse: string;
  neutral: { muted: string; emphasis: string };
}

// ── Functional: foregrounds ──────────────────────────────────────────────────

export interface ForegroundColors {
  default: string;
  muted: string;
  onEmphasis: string;
  disabled: string;
  link: string;
  white: string;
  neutral: string;
}

// ── Functional: borders ───────────────────────────────────────────────────────

export interface BorderColors {
  default: string;
  muted: string;
  emphasis: string;
  disabled: string;
  transparent: string;
  translucent: string;
  neutral: { muted: string; emphasis: string };
}

// ── Functional: syntax (prettylights) ────────────────────────────────────────

export interface SyntaxColors {
  comment: string;
  constant: string;
  constantOtherReferenceLink: string;
  entity: string;
  entityTag: string;
  keyword: string;
  key: string;
  string: string;
  stringRegexp: string;
  variable: string;
  brackethighlighterAngle: string;
  brackethighlighterUnmatched: string;
  carriageReturnBg: string;
  carriageReturnText: string;
  invalidIllegalText: string;
  invalidIllegalBg: string;
  markupBold: string;
  markupItalic: string;
  markupHeading: string;
  markupList: string;
  markupInsertedBg: string;
  markupInsertedText: string;
  markupDeletedBg: string;
  markupDeletedText: string;
  markupChangedBg: string;
  markupChangedText: string;
  nullLiteral: string;
  /** Both true and false — purple by default. Not red/green: value has no inherent sentiment. */
  booleanLiteral: string;
  /** { } [ ] brackets and braces */
  bracket: string;
  /** String values that look like a URL */
  stringUrl: string;
  /** String values that look like an email address */
  stringEmail: string;
  /** String values that look like a UUID */
  stringUuid: string;
  /** Background tint applied to a row when the pointer hovers over it */
  rowHoverBg: string;
}

/** Maps to Figma component tokens: button / {variant} / bgColor | borderColor | fgColor */
export interface ButtonVariantStateColors {
  rest: string;
  hover: string;
  pressed: string;
  disabled: string;
}

export interface ButtonVariantInteractiveColors {
  bgColor: ButtonVariantStateColors;
  borderColor: ButtonVariantStateColors;
  fgColor: ButtonVariantStateColors;
}

export interface ButtonFunctionalColors {
  primary: ButtonVariantInteractiveColors;
  secondary: ButtonVariantInteractiveColors;
  danger: ButtonVariantInteractiveColors;
  /** Pill-style control; maps to Figma `button/rounded/*` */
  rounded: ButtonVariantInteractiveColors;
}

export interface FunctionalColors {
  background: BackgroundColors;
  foreground: ForegroundColors;
  border: BorderColors;
  syntax: SyntaxColors;
  /** Component-scoped colors — start with primary; other variants follow the same shape */
  button: ButtonFunctionalColors;
}

export interface Colors {
  base: BaseColors;
  functional: FunctionalColors;
}

// ── Typography ────────────────────────────────────────────────────────────────

export interface FontFamilyTokens {
  base: string;
  mono: string;
}

export interface FontSizeTokens {
  xs: string;   // 12px — caption
  sm: string;   // 14px — body small
  md: string;   // 16px — body medium, title small
  lg: string;   // 20px — title medium
  xl: string;   // 24px — title large
  xxl: string;  // 32px — display
}

export interface FontWeightTokens {
  regular: number;   // 400
  medium: number;    // 500
  semibold: number;  // 600
  bold: number;      // 700
}

export interface LineHeightTokens {
  tight: number;    // 1.25
  normal: number;   // 1.5
  relaxed: number;  // 1.75
}

export interface TextStyle {
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  fontFamily?: string;
}

export interface TextTokens {
  display: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  titleSmall: TextStyle;   // 1rem / semibold / 1.5 (matches Primer)
  subtitle: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  caption: TextStyle;
  codeBlock: TextStyle;    // for <pre> blocks
  inlineCode: TextStyle;   // for <code> inline
}

/** Button label metrics per control size (from typography tokens). */
export interface ButtonTypographyStop {
  fontSize: string;
  lineHeight: string;
}

export interface ButtonTypography {
  extraSmall: ButtonTypographyStop;
  small: ButtonTypographyStop;
  medium: ButtonTypographyStop;
  large: ButtonTypographyStop;
}

export interface Typography {
  fontFamily: FontFamilyTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  lineHeight: LineHeightTokens;
  text: TextTokens;
  button: ButtonTypography;
}

// ── Sizes ─────────────────────────────────────────────────────────────────────

export interface SpaceTokens {
  1: string;   // 4px
  2: string;   // 8px
  3: string;   // 12px
  4: string;   // 16px
  5: string;   // 20px
  6: string;   // 24px
  8: string;   // 32px
  10: string;  // 40px
  12: string;  // 48px
}

export interface BorderRadiusTokens {
  sm: string;    // 4px
  md: string;    // 6px
  lg: string;    // 8px
  xl: string;    // 12px
  full: string;  // 9999px
}

export interface BorderWidthTokens {
  thin: string;   // 1px
  thick: string;  // 2px
}

/** Shared control geometry (button, input, etc.) — from functional size tokens. */
export interface ControlPaddingInlineTokens {
  condensed: string;
  normal: string;
  spacious: string;
}

export interface ControlSizeStopTokens {
  /** Outer height (border-box) */
  size: string;
  /** Corner radius for this control stop (buttons, inputs, etc.) */
  borderRadius: string;
  gap: string;
  paddingBlock: string;
  paddingInline: ControlPaddingInlineTokens;
}

export interface ControlSizesTokens {
  extraSmall: ControlSizeStopTokens;
  small: ControlSizeStopTokens;
  medium: ControlSizeStopTokens;
  large: ControlSizeStopTokens;
}

export interface Sizes {
  space: SpaceTokens;
  borderRadius: BorderRadiusTokens;
  borderWidth: BorderWidthTokens;
  control: ControlSizesTokens;
}

// Convenience alias for space token keys (used by Stack gap/padding props)
export type SpaceKey = keyof SpaceTokens;

// ── Full resolved theme (all values present) ──────────────────────────────────

export interface ThemeTokens {
  colors: Colors;
  typography: Typography;
  sizes: Sizes;
}

/**
 * What consumers pass to <ThemeProvider theme={...}> or the component theme prop.
 * Any deeply-nested subset is valid — missing keys fall back to the default theme.
 */
export type CubeTheme = DeepPartial<ThemeTokens>;
