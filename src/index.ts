// ── Core primitives ───────────────────────────────────────────────────────────
export { Stack } from "./components/core/Stack";
export type { StackProps } from "./components/core/Stack";

export { Text } from "./components/core/Text";
export type { TextProps, TextVariant, TextColor } from "./components/core/Text";

export { Button } from "./components/core/Button";
export type { ButtonProps, ButtonShape, ButtonSize, ButtonVariant } from "./components/core/Button";

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
} from "./theme/types";
