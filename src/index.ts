// ── Core primitives ───────────────────────────────────────────────────────────
export { Stack } from "./components/core/Stack";
export type { StackProps } from "./components/core/Stack";

export { Text } from "./components/core/Text";
export type { TextProps, TextVariant, TextColor } from "./components/core/Text";

export { Button } from "./components/core/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/core/Button";

export { IconButton } from "./components/core/IconButton";
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from "./components/core/IconButton";

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
  DataGridTheme,
  ThemeTokens,
  Colors,
  BaseColors,
  ColorScale,
  FunctionalColors,
  BackgroundColors,
  ForegroundColors,
  BorderColors,
  ShadowTokens,
  SyntaxColors,
  Typography,
  TextStyle,
  TextTokens,
  Sizes,
  SpaceKey,
  ComponentTokens,
  ButtonComponentTokens,
  ButtonSizeTokens,
  IconButtonComponentTokens,
  IconButtonSizeTokens,
} from "./theme/types";
