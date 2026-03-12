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

// ── Functional: shadows ───────────────────────────────────────────────────────

export interface ShadowTokens {
  resting: {
    xsmall: string;
    small: string;
    medium: string;
  };
  floating: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  inset: string;
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

// ── Functional: danger ────────────────────────────────────────────────────────

export interface DangerColors {
  bg: string;          // solid danger background (e.g. red button fill)
  bgHover: string;     // hover state of solid danger background
  bgMuted: string;     // subtle danger surface (e.g. ghost danger hover)
  fg: string;          // text/icon on a solid danger background (usually white)
  fgOnSubtle: string;  // danger-coloured text on a light background
  border: string;      // danger border (e.g. outlined danger button)
}

export interface FunctionalColors {
  background: BackgroundColors;
  foreground: ForegroundColors;
  border: BorderColors;
  shadow: ShadowTokens;
  syntax: SyntaxColors;
  danger: DangerColors;
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

export interface Typography {
  fontFamily: FontFamilyTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  lineHeight: LineHeightTokens;
  text: TextTokens;
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

export interface Sizes {
  space: SpaceTokens;
  borderRadius: BorderRadiusTokens;
  borderWidth: BorderWidthTokens;
}

// Convenience alias for space token keys (used by Stack gap/padding props)
export type SpaceKey = keyof SpaceTokens;

// ── Component size compositions ───────────────────────────────────────────────

/**
 * A single button size — all values derived so that height = paddingY*2 + lineHeight + border*2.
 *
 *  sm → 3 + 16 + 3 + 2(border) = 24 px
 *  md → 5 + 20 + 5 + 2(border) = 32 px
 *  lg → 9 + 20 + 9 + 2(border) = 40 px
 */
export interface ButtonSizeTokens {
  height: string;       // total outer height (border-box)
  paddingX: string;     // horizontal inner padding
  paddingY: string;     // vertical inner padding
  fontSize: string;     // label font-size
  lineHeight: string;   // label line-height (px string)
  iconGap: string;      // gap between leading/trailing icon and label
}

export interface ButtonComponentTokens {
  sm: ButtonSizeTokens;
  md: ButtonSizeTokens;
  lg: ButtonSizeTokens;
}

/**
 * A single icon-button size — centered via flex so icon lives inside the total size.
 *
 *  sm → 16px icon, 4px padding each side  → 24px outer
 *  md → 20px icon, 6px padding each side  → 32px outer
 */
export interface IconButtonSizeTokens {
  size: string;      // width and height of the button (border-box)
  iconSize: string;  // width and height of the svg inside
}

export interface IconButtonComponentTokens {
  sm: IconButtonSizeTokens;
  md: IconButtonSizeTokens;
}

export interface ComponentTokens {
  button: ButtonComponentTokens;
  iconButton: IconButtonComponentTokens;
}

// ── Full resolved theme (all values present) ──────────────────────────────────

export interface ThemeTokens {
  colors: Colors;
  typography: Typography;
  sizes: Sizes;
  components: ComponentTokens;
}

/**
 * What consumers pass to <ThemeProvider theme={...}> or the component theme prop.
 * Any deeply-nested subset is valid — missing keys fall back to the default theme.
 */
export type DataGridTheme = DeepPartial<ThemeTokens>;
