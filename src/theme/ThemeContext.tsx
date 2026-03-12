import React, { createContext, useContext } from "react";
import type { ThemeTokens, DataGridTheme } from "./types";
import { defaultTheme } from "./defaultTheme";
import { deepMerge } from "./utils";

const ThemeContext = createContext<ThemeTokens>(defaultTheme);

export interface ThemeProviderProps {
  theme?: DataGridTheme;
  children: React.ReactNode;
}

/**
 * Wrap your app (or a subtree) to apply a custom theme to all components inside.
 *
 * @example
 * <ThemeProvider theme={{ colors: { functional: { background: { default: '#0f172a' } } } }}>
 *   <JsonViewer data={myData} />
 * </ThemeProvider>
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const merged = theme
    ? deepMerge(defaultTheme, theme as Partial<ThemeTokens>)
    : defaultTheme;

  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>;
}

/**
 * Internal hook used by components to read the resolved theme.
 * A per-component `theme` prop is deep-merged on top of the context theme.
 */
export function useTheme(localTheme?: DataGridTheme): ThemeTokens {
  const contextTheme = useContext(ThemeContext);
  if (!localTheme) return contextTheme;
  return deepMerge(contextTheme, localTheme as Partial<ThemeTokens>);
}
