// ── Core primitives ───────────────────────────────────────────────────────────

export { Table, SimpleTable } from "./components/core/Table";
export type {
  TableProps,
  TableRootProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeadCellProps,
  TableCellProps,
  TableRowLayout,
  TableCellAlign,
  TableDensity,
  TableLines,
  SimpleTableProps,
} from "./components/core/Table";
export type { ColumnDef, OnChangeFn, Row, SortingState } from "@tanstack/react-table";

export { Container } from "./components/core/Container";
export type { ContainerProps, ContainerWidth } from "./components/core/Container";

export { Box } from "./components/core/Box";
export type { BoxProps, BoxOwnProps } from "./components/core/Box";
export type { Space } from "./utils/space";
export type { BgColor, BorderColor, FgColor } from "./utils/colorPaths";


export { Divider } from "./components/core/Divider";
export type { DividerProps, DividerColor } from "./components/core/Divider";
export { Heading } from "./components/core/Heading";
export type { HeadingProps, HeadingLevel, HeadingSize } from "./components/core/Heading";
export { Subtitle } from "./components/core/Subtitle";
export type { SubtitleProps } from "./components/core/Subtitle";

export { Callout } from "./components/core/Callout";
export type { CalloutProps } from "./components/core/Callout";

export { Highlight } from "./components/core/Highlight";
export type { HighlightProps, HighlightColor } from "./components/core/Highlight";

export { Text } from "./components/core/Text";
export type { TextProps, TextColor, TextSize } from "./components/core/Text";

export { Button } from "./components/core/Button";
export type { ButtonProps } from "./components/core/Button";

export { IconButton } from "./components/core/IconButton";
export type { IconButtonProps } from "./components/core/IconButton";

export { Tooltip } from "./components/core/Tooltip";
export type { TooltipProps, TooltipPlacement } from "./components/core/Tooltip";

export { Icon } from "./components/core/Icon";
export type { IconProps, IconSize } from "./components/core/Icon";

export * from "./icons";

export { Link } from "./components/core/Link";
export type { LinkProps, LinkVariant } from "./components/core/Link";

export { Pill } from "./components/core/Pill";
export type { PillProps, PillShade, PillIntensity, PillSize } from "./components/core/Pill";

export { BreadcrumbLink, Breadcrumbs } from "./components/core/Breadcrumb";
export type {
  BreadcrumbLinkProps,
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
export type {
  PopoverProps,
  PopoverPlacement,
  PopoverElevation,
  PopoverAction,
  PopoverFooterActions,
} from "./components/core/Popover";

export { ActionMenu, ActionMenuItem, ActionMenuList } from "./components/core/ActionMenu";
export type {
  ActionMenuProps,
  ActionMenuItemProps,
  ActionMenuListProps,
  ActionMenuListRegionProps,
  ActionMenuListSectionProps,
} from "./components/core/ActionMenu";

export { Sidebar, useSidebar } from "./components/core/Sidebar";
export type {
  SidebarProps,
  SidebarEdge,
  SidebarRegionProps,
  SidebarHeaderProps,
  SidebarSectionProps,
  SidebarItemProps,
  SidebarToggleProps,
  SidebarWidth,
  SidebarWidthStop,
} from "./components/core/Sidebar";

export { SplitLayout } from "./components/core/SplitLayout";
export type { SplitLayoutProps, SplitLayoutMainProps } from "./components/core/SplitLayout";

// ── Data components ───────────────────────────────────────────────────────────
export {
  CodeSurface,
  CodeBlock,
  JsonViewer as JsonCodeView,
  buildLines,
  getAllCollapsiblePaths,
  highlightSource,
} from "./components/CodeBlock";
export type {
  CodeBlockLanguage,
  CodeBlockProps,
  CodeSurfaceProps,
  CodeSurfaceGutterIcons,
  JsonViewerProps as JsonCodeViewProps,
  SurfaceLine,
  SurfaceToken,
  CodeLine,
  Token,
  TokenType,
} from "./components/CodeBlock";

/** @deprecated Use {@link JsonCodeView} */
export { CodeSnippet } from "./components/CodeSnippet";
/** @deprecated Use {@link JsonCodeViewProps} */
export type { CodeSnippetProps } from "./components/CodeSnippet";

export { DataGrid } from "./components/DataGrid";
export type { DataGridProps } from "./components/DataGrid";

export {
  ApiResponseViewer,
  statusPillShade,
  statusReasonPhrase,
  methodPillShade,
} from "./components/ApiResponseViewer";
export type {
  ApiResponseHeaders,
  ApiResponseViewerProps,
  HttpMethod,
} from "./components/ApiResponseViewer";

export { JsonViewer } from "./components/JsonViewer";
export type { JsonViewerProps, JsonViewerMode } from "./components/JsonViewer";

// ── Tokens & modes ────────────────────────────────────────────────────────────
// Token consumption (ADR-04): build-time overrides, runtime modes.
export { useTokens, useMode, getMode, setMode } from "./mode";
export type { ModeName, SizeScale, Tokens } from "./mode";

