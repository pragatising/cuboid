// ── Core primitives ───────────────────────────────────────────────────────────
export { Stack } from "./components/core/Stack";
export type { StackProps, StackDirection, StackGap, StackPadding, StackSpacing } from "./components/core/Stack";
export type { Breakpoint, Responsive } from "./utils/responsive";

export { Text } from "./components/core/Text";
export type { TextProps, TextVariant, TextColor } from "./components/core/Text";

export { Button } from "./components/core/Button";
export type { ButtonProps, ButtonShape, ButtonSize, ButtonVariant } from "./components/core/Button";

export { IconButton } from "./components/core/IconButton";
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./components/core/IconButton";

export { Tooltip } from "./components/core/Tooltip";
export type { TooltipProps, TooltipPlacement } from "./components/core/Tooltip";

export { Icon } from "./components/core/Icon";
export type { IconProps, IconSize } from "./components/core/Icon";

export { Link } from "./components/core/Link";
export type { LinkProps, LinkVariant } from "./components/core/Link";

export { Pill } from "./components/core/Pill";
export type { PillProps, PillShade } from "./components/core/Pill";

export { BreadcrumbLink, Breadcrumbs } from "./components/core/Breadcrumb";
export type {
  BreadcrumbLinkProps,
  BreadcrumbLinkState,
  BreadcrumbsProps,
  BreadcrumbItem,
} from "./components/core/Breadcrumb";

export { SiteHeader, SiteHeaderDivider } from "./components/core/SiteHeader";
export type { SiteHeaderProps, SiteHeaderDividerProps } from "./components/core/SiteHeader";

export { Overlay } from "./components/core/Overlay";
export type { OverlayProps, OverlayVariant } from "./components/core/Overlay";

export { Sheet } from "./components/core/Sheet";
export type {
  SheetProps,
  SheetEdge,
  SheetRegionProps,
  SheetWidth,
  SheetWidthStop,
} from "./components/core/Sheet";

export { ResizeHandle } from "./components/core/ResizeHandle";
export type {
  ResizeHandleProps,
  ResizeHandleOrientation,
  ResizeHandleEdge,
} from "./components/core/ResizeHandle";

export { Popover } from "./components/core/Popover";
export type { PopoverProps, PopoverPlacement, PopoverElevation } from "./components/core/Popover";

export { ActionMenu, ActionMenuItem, ActionMenuList } from "./components/core/ActionMenu";
export type {
  ActionMenuProps,
  ActionMenuItemProps,
  ActionMenuListProps,
  ActionMenuListRegionProps,
  ActionMenuListSectionProps,
} from "./components/core/ActionMenu";

// ── Data components ───────────────────────────────────────────────────────────
export { CodeSnippet } from "./components/CodeSnippet";
export type { CodeSnippetProps } from "./components/CodeSnippet";

export { DataGrid } from "./components/DataGrid";
export type { DataGridProps } from "./components/DataGrid";

export { JsonViewer } from "./components/JsonViewer";
export type { JsonViewerProps, JsonViewerMode } from "./components/JsonViewer";

// ── Theme ─────────────────────────────────────────────────────────────────────
export { ThemeProvider, useTheme } from "./theme/ThemeContext";
export { defaultTheme } from "./theme/defaultTheme";
export {
  buildFigmaLightTheme,
  getFigmaLightMergedTokens,
} from "./theme/figma/buildFigmaTheme";
export type {
  CubeTheme,
  ThemeTokens,
  Colors,
  BaseColors,
  ColorScale,
  FunctionalColors,
  BackgroundColors,
  ForegroundColors,
  BorderColors,
  SyntaxColors,
  Typography,
  TextStyle,
  TextTokens,
  Sizes,
  SpaceKey,
  ZIndexTokens,
  TooltipSurfaceColors,
  TooltipLayoutTokens,
  IconButtonFunctionalColors,
  IconButtonSizesTokens,
  IconButtonSizeStopTokens,
  LinkFunctionalColors,
  LinkFgColors,
  PillFunctionalColors,
  PillIntensity,
  PillIntensityColors,
  PillSurface,
  PillSizesTokens,
  PillSizeStopTokens,
  BreadcrumbFunctionalColors,
  BreadcrumbSizesTokens,
  OverlayFunctionalColors,
  SheetFunctionalColors,
  SheetSizesTokens,
  SheetWidthStopTokens,
  PopoverFunctionalColors,
  PopoverLayoutTokens,
  ActionMenuFunctionalColors,
  ActionMenuItemBgColors,
  ActionMenuItemFgColors,
  ActionMenuItemSizeTokens,
  ActionMenuListSizeTokens,
  ActionMenuSectionSizeTokens,
  ActionMenuHeaderSizeTokens,
  ActionMenuFooterSizeTokens,
  ActionMenuSizesTokens,
  ResizeHandleSizesTokens,
  ShadowTokens,
  SiteHeaderFunctionalColors,
  SiteHeaderSizesTokens,
  BreakpointTokens,
  GlobalColors,
  GlobalTextColors,
  GlobalCanvasColors,
  GlobalSemanticColorPair,
} from "./theme/types";
