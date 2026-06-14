import type { ThemeTokens } from "../../../theme/types";

export function sidebarCssVars(tokens: ThemeTokens): Record<string, string> {
  const { sidebar } = tokens.colors.functional;
  const layout = tokens.sizes.sidebar;

  return {
    "--cube-sidebar-bg": sidebar.background,
    "--cube-sidebar-border": sidebar.border,
    "--cube-sidebar-width-sm": layout.width.sm,
    "--cube-sidebar-width-md": layout.width.md,
    "--cube-sidebar-width-lg": layout.width.lg,
    "--cube-sidebar-width-minimized": layout.widthMinimized,
    "--cube-sidebar-min-width": layout.minWidth,
    "--cube-sidebar-max-width": layout.maxWidth,
    "--cube-sidebar-padding": layout.padding,
    "--cube-sidebar-footer-padding": layout.footerPadding,
  };
}
