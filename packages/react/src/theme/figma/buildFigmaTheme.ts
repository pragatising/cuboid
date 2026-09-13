import type { ThemeTokens } from "../types";
import { defaultTheme } from "../defaultTheme";

/**
 * Placeholder for merging Figma-exported tokens into the runtime theme.
 * Wire `tokens/base` + `tokens/functional` here when the import pipeline is ready.
 */
export function buildFigmaLightTheme(): ThemeTokens {
  return defaultTheme;
}

export function getFigmaLightMergedTokens(): ThemeTokens {
  return defaultTheme;
}
