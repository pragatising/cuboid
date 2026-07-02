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
  /** JSON / numeric literal values — not identifiers (`variable`). */
  numberLiteral: string;
  /** Both true and false — purple by default. Not red/green: value has no inherent sentiment. */
  booleanLiteral: string;
  /** { } [ ] at nesting depth 0 */
  bracket: string;
  /** { } [ ] at odd nesting depths (first level nested and below, alternating) */
  bracketNested: string;
  /** String values that look like a URL */
  stringUrl: string;
  /** String values that look like an email address */
  stringEmail: string;
  /** String values that look like a UUID */
  stringUuid: string;
  /** Background tint applied to a row when the pointer hovers over it */
  rowHoverBg: string;
  /** Background tint for a collapsed JSON node summary row */
  collapsedRowBg: string;
  /** Gutter watchlist marker dot when line is watched */
  watchMark: string;
  /** Gutter watchlist dot preview on row hover (before click) */
  watchMarkHover: string;
  /** Row background when line is on the watchlist */
  watchRowBg: string;
}

/** Resolved palette from tokens/functional/colors/globals.json (color.* paths). */
export type { GlobalColorPath } from "./globalColor";
export {
  resolveGlobalColor,
  resolveGlobalColorOrCss,
  globalColorsToCssVars,
  GLOBAL_COLOR_PATH_EXAMPLES,
} from "./globalColor";

export interface GlobalSemanticColorPair {
  default: string;
  muted: string;
}

export interface GlobalTextColors {
  inverted: string;
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

export interface TableSurfaceColors {
  bgColor: string;
  fgColor: string;
  borderColor: string;
}

export interface TableContainerColors {
  borderColor: string;
}

export interface TableFunctionalColors {
  header: TableSurfaceColors;
  body: TableSurfaceColors;
  container: TableContainerColors;
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

export interface PillSurfaceColors {
  bgColor: string;
  fgColor: string;
  borderColor: string;
}

export interface PillIntensityColors {
  filled: PillSurfaceColors;
  bordered: PillSurfaceColors;
}

/** Keys are shade names (`gray`, `yellow`, …) from token files under `components/pill/`. */
export type PillFunctionalColors = Record<string, Record<PillIntensity, PillIntensityColors>>;

/** Chip geometry from `pill.json`. */
export interface PillLayoutTokens {
  paddingInline: string;
  paddingBlock: string;
  borderRadius: string;
  gap: string;
  /** Fixed outer height — icons do not expand the chip. */
  height: string;
}

import type { TokenOutput } from "./tokenOutput";

export interface HighlightColorRecipe {
  bgColor: string;
  fgColor: string;
}

/** Keys from built `token-output.json` — add stops in highlight/highlight.json, then `npm run tokens:theme`. */
export type HighlightFunctionalColors = TokenOutput["highlightColors"];

export type HighlightColor = keyof HighlightFunctionalColors;

export interface HighlightSizesTokens {
  paddingInline: string;
  paddingBlock: string;
  borderRadius: string;
}

export interface FunctionalColors {
  syntax: SyntaxColors;
  /** Component-scoped colors — start with primary; other variants follow the same shape */
  button: ButtonFunctionalColors;
  iconButton: IconButtonFunctionalColors;
  link: LinkFunctionalColors;
  highlight: HighlightFunctionalColors;
  breadcrumb: BreadcrumbFunctionalColors;
  table: TableFunctionalColors;
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
  xs: string;   // text.sizes.xs — 12px
  sm: string;   // text.sizes.sm — 14px
  md: string;   // text.sizes.md — 20px
  lg: string;   // text.sizes.lg — 24px
  xl: string;   // text.sizes.xl — 32px
  xxl: string;  // alias of xl — display
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
  /** heading + text.sizes — metrics from heading.weight / heading.lineHeight */
  headingXs: TextStyle;
  headingSm: TextStyle;
  headingMd: TextStyle;
  headingLg: TextStyle;
  headingXl: TextStyle;
  /** body + text.sizes — metrics from text.weight / text.lineHeight */
  bodyXs: TextStyle;
  bodySm: TextStyle;
  bodyMd: TextStyle;
  bodyLg: TextStyle;
  bodyXl: TextStyle;
  /** text.subhead.* — section labels, nav groups */
  subheadXs: TextStyle;
  subheadSm: TextStyle;
  subheadMd: TextStyle;
  codeBlock: TextStyle;
  inlineCode: TextStyle;
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

/** Internal px-keyed spacing (`"8"` → 0.5rem). Source: tokens/functional/size/space.json */
export type SpaceTokens = Record<string, string>;

/** 8pt grid scale — `1x` = 8px, `1.5x` = 12px, … Built from `space` via px ÷ 8. */
export type SpaceScaleTokens = Record<string, string>;

export type SpaceScale = `${number}x`;

/** Px stop key in `sizes.space` — prefer `SpaceScale` in component APIs. */
export type SpacePxKey = `${number}`;

/** Public spacing token — 8pt grid multiplier only. */
export type SpaceToken = SpaceScale;

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
  /** Leading/trailing glyph size (labeled buttons, inputs with icons, etc.) */
  icon: string;
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

/** Standalone icon glyph sizes (`tokens/functional/size/icon.json`). */
export interface IconSizesTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
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

export interface TableDensitySizeTokens {
  cellPaddingInline: string;
  cellPaddingBlock: string;
  rowHeight: string;
}

export interface TableSizesTokens {
  borderRadius: string;
  density: {
    dense: TableDensitySizeTokens;
    spacious: TableDensitySizeTokens;
  };
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

export interface FocusRingTokens {
  width: string;
  offset: string;
}

export interface Sizes {
  space: SpaceTokens;
  spaceScale: SpaceScaleTokens;
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
  icon: IconSizesTokens;
  iconButton: IconButtonSizesTokens;
  breadcrumb: BreadcrumbSizesTokens;
  table: TableSizesTokens;
  siteHeader: SiteHeaderSizesTokens;
  sheet: SheetSizesTokens;
  sidebar: SidebarSizesTokens;
  popover: PopoverLayoutTokens;
  actionMenu: ActionMenuSizesTokens;
  resizeHandle: ResizeHandleSizesTokens;
  focusRing: FocusRingTokens;
  zIndex: ZIndexTokens;
}

// Convenience alias for space token keys
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
