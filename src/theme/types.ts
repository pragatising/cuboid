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

/** Resolved palette from tokens/functional/colors/globals.json (color.* paths). */
export type { GlobalColorPath } from "./globalColor";
export {
  resolveGlobalColor,
  resolveGlobalColorOrCss,
  GLOBAL_COLOR_PATH_EXAMPLES,
} from "./globalColor";

export interface GlobalSemanticColorPair {
  default: string;
  muted: string;
}

export interface GlobalTextColors {
  contrast: string;
  default: string;
  muted: string;
  subtle: string;
  disabled: string;
}

export interface GlobalCanvasColors {
  default: string;
  modal: string;
  inset: string;
  insetStrong: string;
  subtle: string;
  transparent: string;
  overlay: {
    modal: string;
    sheet: string;
  };
}

export interface GlobalColors {
  primary: string;
  black: string;
  white: string;
  focus: string;
  success: GlobalSemanticColorPair;
  warning: GlobalSemanticColorPair;
  error: GlobalSemanticColorPair;
  info: GlobalSemanticColorPair;
  fg: Record<string, Record<string, string>>;
  text: GlobalTextColors;
  canvas: GlobalCanvasColors;
  border: {
    gray: Record<string, string>;
    grayAlpha: Record<string, string>;
  };
  bg: {
    gray: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  };
  syntax: SyntaxColors;
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
  ghost: ButtonVariantInteractiveColors;
  danger: ButtonVariantInteractiveColors;
  /** Pill-style control; maps to Figma `button/rounded/*` */
  rounded: ButtonVariantInteractiveColors;
}

/**
 * Per-variant icon button colors for theme/CSS (`unselected` = token `base`).
 * Token path: `color.iconButton.<variant>.<base|selected>.<bgColor|borderColor|fgColor>.<interaction>`.
 */
export interface IconButtonAppearanceColors {
  unselected: ButtonVariantInteractiveColors;
  selected: ButtonVariantInteractiveColors;
}

/** Variant names come from token keys under `color.iconButton` (build does not hardcode them). */
export type IconButtonFunctionalColors = Record<string, IconButtonAppearanceColors>;

/** Tooltip surface (Figma `colors/gray/13` fill, inverse text) */
export interface TooltipSurfaceColors {
  background: string;
  border: string;
  foreground: string;
}

/** Text link foreground — rest + hover only (`color.link.<variant>.fgColor`). */
export interface LinkFgColors {
  rest: string;
  hover: string;
}

export interface LinkFunctionalColors {
  inline: LinkFgColors;
  standalone: LinkFgColors;
}

export interface BreadcrumbLinkStateColors {
  rest: string;
  hover: string;
  active: string;
}

export interface BreadcrumbLinkColors {
  bgColor: BreadcrumbLinkStateColors;
  fgColor: BreadcrumbLinkStateColors;
}

export interface BreadcrumbSeparatorColors {
  fgColor: string;
}

export interface BreadcrumbFunctionalColors {
  link: BreadcrumbLinkColors;
  separator: BreadcrumbSeparatorColors;
}

export interface SiteHeaderFunctionalColors {
  background: string;
  border: string;
  divider: string;
}

export interface OverlayFunctionalColors {
  modal: string;
  sheet: string;
  none: string;
}

export interface SheetFunctionalColors {
  background: string;
}

export interface SidebarFunctionalColors {
  background: string;
  border: string;
}

export interface PopoverFunctionalColors {
  background: string;
}

export interface ActionMenuItemBgColors {
  rest: string;
  hover: string;
  pressed: string;
  disabled: string;
  selected: {
    rest: string;
    pressed: string;
  };
}

export interface ActionMenuItemFgColors {
  rest: string;
  pressed: string;
  disabled: string;
  selected: string;
  subtext: string;
}

export interface ActionMenuFunctionalColors {
  item: {
    bgColor: ActionMenuItemBgColors;
    fgColor: ActionMenuItemFgColors;
  };
  section: { fgColor: string };
  divider: { fgColor: string };
}

export interface ActionMenuItemSizeTokens {
  minHeight: string;
  paddingInline: string;
  paddingBlock: string;
  borderRadius: string;
  slotGap: string;
  subtextGap: string;
  iconSize: string;
  subtextIconSize: string;
}

export interface ActionMenuListSizeTokens {
  paddingInline: string;
  paddingBlock: string;
  /** Gap between rows within a section (and bare items in the list). */
  itemGap: string;
  /** Extra spacing between section groups — applied in addition to `itemGap`. */
  sectionGap: string;
}

export interface ActionMenuSectionSizeTokens {
  paddingInline: string;
  paddingBlock: string;
}

export interface ActionMenuHeaderSizeTokens {
  paddingInline: string;
  paddingBlockStart: string;
  paddingBlockEnd: string;
}

export interface ActionMenuFooterSizeTokens {
  padding: string;
}

export interface ActionMenuSizesTokens {
  item: ActionMenuItemSizeTokens;
  list: ActionMenuListSizeTokens;
  section: ActionMenuSectionSizeTokens;
  header: ActionMenuHeaderSizeTokens;
  footer: ActionMenuFooterSizeTokens;
}

export type PillSurface = "filled" | "bordered";

/** Matches Figma Pill intensity property. */
export type PillIntensity = "extralight" | "light" | "bold" | "extraBold";

export interface PillIntensityColors {
  filled: ButtonVariantInteractiveColors;
  bordered: ButtonVariantInteractiveColors;
}

/** Keys are shade names (`gray`, `yellow`, …) from token files under `components/pill/`. */
export type PillFunctionalColors = Record<string, Record<PillIntensity, PillIntensityColors>>;

/** Chip geometry from `pill.json` (scales with inherited font size via em). */
export interface PillLayoutTokens {
  paddingInline: string;
  paddingBlock: string;
  borderRadius: string;
  gap: string;
}

export interface HighlightColorRecipe {
  bgColor: string;
  fgColor: string;
}

/** Shade keys from Figma `HighlightedText` — `none` is plain muted text without a tint. */
export type HighlightColor = "none" | "neutral" | "green" | "blue" | "yellow" | "orange" | "red";

export type HighlightFunctionalColors = Record<HighlightColor, HighlightColorRecipe>;

export interface HighlightSizesTokens {
  paddingInline: string;
  paddingBlock: string;
  borderRadius: string;
}

export interface FunctionalColors {
  background: BackgroundColors;
  foreground: ForegroundColors;
  border: BorderColors;
  syntax: SyntaxColors;
  /** Component-scoped colors — start with primary; other variants follow the same shape */
  button: ButtonFunctionalColors;
  iconButton: IconButtonFunctionalColors;
  link: LinkFunctionalColors;
  highlight: HighlightFunctionalColors;
  breadcrumb: BreadcrumbFunctionalColors;
  siteHeader: SiteHeaderFunctionalColors;
  overlay: OverlayFunctionalColors;
  sheet: SheetFunctionalColors;
  sidebar: SidebarFunctionalColors;
  popover: PopoverFunctionalColors;
  actionMenu: ActionMenuFunctionalColors;
  pill: PillFunctionalColors;
  tooltip: TooltipSurfaceColors;
}

export interface Colors {
  base: BaseColors;
  functional: FunctionalColors;
  global: GlobalColors;
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

/** Named scale for Stack `gap`. */
export interface StackGapTokens {
  none: string;
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/** Named scale for Stack `padding` / `paddingBlock` / `paddingInline`. */
export interface StackPaddingTokens {
  none: string;
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export type StackGap = keyof StackGapTokens;
export type StackPadding = keyof StackPaddingTokens;

/** @deprecated Use `StackGap` or `StackPadding` — gap and padding share the same stop names. */
export type StackSpacing = StackGap;
/** @deprecated Use `StackGapTokens` or `StackPaddingTokens`. */
export type StackSpacingTokens = StackGapTokens;

/** Min-width thresholds — `sm` is implicit (0); use in `@media (min-width: var(--cube-breakpoint-md))`. */
export interface BreakpointTokens {
  md: string;
  lg: string;
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

export interface PopoverLayoutTokens {
  /** Offset between trigger and panel surface */
  gap: string;
  borderRadius: string;
  minWidth: string;
  maxWidth: string;
}

export interface TooltipLayoutTokens {
  /** Offset between trigger and tooltip surface */
  gap: string;
  borderRadius: string;
  paddingInline: string;
  paddingBlock: string;
  maxWidth: string;
  maxWidthSingleLine: string;
  boxShadow: string;
}

/** Icon-only control geometry — hit target, radius, glyph; no padding/gap (`size.control.iconButton` in `tokens/functional/size/size.json`). */
export interface IconButtonSizeStopTokens {
  /** Border-box width/height of the control */
  size: string;
  borderRadius: string;
  /** Icon / visual glyph box (width & height) */
  icon: string;
}

export interface IconButtonSizesTokens {
  extraSmall: IconButtonSizeStopTokens;
  small: IconButtonSizeStopTokens;
  medium: IconButtonSizeStopTokens;
  large: IconButtonSizeStopTokens;
}

export interface BreadcrumbSizesTokens {
  gap: string;
  itemPaddingInline: string;
  itemPaddingBlock: string;
  itemBorderRadius: string;
  separatorWidth: string;
}

export interface SiteHeaderSizesTokens {
  height: string;
  paddingInlineStart: string;
  paddingInlineEnd: string;
  paddingBlock: string;
  leadingGap: string;
  trailingGap: string;
  dividerHeight: string;
  dividerWidth: string;
}

/** Shared stacking order for portaled / floating UI — one ladder for the whole system. */
export interface ZIndexTokens {
  base: string;
  raised: string;
  sticky: string;
  dropdown: string;
  overlay: string;
  sheet: string;
  dialog: string;
  popover: string;
  tooltip: string;
  toast: string;
  max: string;
}

export interface SheetWidthStopTokens {
  sm: string;
  md: string;
  lg: string;
}

export interface SheetSizesTokens {
  width: SheetWidthStopTokens;
  minWidth: string;
  maxWidth: string;
  maxHeight: string;
  padding: string;
  /** Top corner radius token — used only when `edge="bottom"` and `roundedTop` is true. */
  bottomCornerRadius: string;
}

export interface SidebarSizesTokens {
  width: SheetWidthStopTokens;
  widthMinimized: string;
  minWidth: string;
  maxWidth: string;
  padding: string;
  footerPadding: string;
}

export interface LayoutTokens {
  pageMaxWidth: string;
  contentMaxWidth: string;
  sectionLabelWidth: string;
  pagePaddingInline: string;
}

/** Shared panel widths for sheet, sidebar, and similar overlays (from size/container.json). */
export interface ContainerSizesTokens {
  panelMinWidth: string;
  sheetWidthSm: string;
  sheetWidthMd: string;
  sheetWidthLg: string;
  sidebarWidthSm: string;
  sidebarWidthMd: string;
  sidebarWidthLg: string;
  sidebarMinWidth: string;
  sidebarMaxWidth: string;
  tooltipMaxWidth: string;
  tooltipMaxWidthSingleLine: string;
  popoverMinWidth: string;
  popoverMaxWidth: string;
}

export type LayoutWidth = "label" | "page" | "content" | "full" | "auto";

export interface ResizeHandleSizesTokens {
  hitArea: string;
}

export interface ShadowTokens {
  popover: string;
  popoverElevated: string;
  sheet: string;
  tooltip: string;
}

export interface Sizes {
  space: SpaceTokens;
  stack: { gap: StackGapTokens; padding: StackPaddingTokens };
  layout: LayoutTokens;
  container: ContainerSizesTokens;
  highlight: HighlightSizesTokens;
  borderRadius: BorderRadiusTokens;
  borderWidth: BorderWidthTokens;
  breakpoints: BreakpointTokens;
  control: ControlSizesTokens;
  tooltip: TooltipLayoutTokens;
  pill: PillLayoutTokens;
  iconButton: IconButtonSizesTokens;
  breadcrumb: BreadcrumbSizesTokens;
  siteHeader: SiteHeaderSizesTokens;
  sheet: SheetSizesTokens;
  sidebar: SidebarSizesTokens;
  popover: PopoverLayoutTokens;
  actionMenu: ActionMenuSizesTokens;
  resizeHandle: ResizeHandleSizesTokens;
  zIndex: ZIndexTokens;
}

// Convenience alias for space token keys (used by Stack gap/padding props)
export type SpaceKey = keyof SpaceTokens;

// ── Full resolved theme (all values present) ──────────────────────────────────

export interface ThemeTokens {
  colors: Colors;
  typography: Typography;
  sizes: Sizes;
  shadows: ShadowTokens;
}

/**
 * What consumers pass to <ThemeProvider theme={...}> or the component theme prop.
 * Any deeply-nested subset is valid — missing keys fall back to the default theme.
 */
export type CubeTheme = DeepPartial<ThemeTokens>;
