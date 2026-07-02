import type { ThemeTokens } from "./types";
import themeFoundation from "./output/theme.json";
import { tokenOutput } from "./tokenOutput";
import baseGenerated from "./output/base.json";

// ── Primitive palette ────────────────────────────────────────────────────────
// Generated from tokens/base/light.json via `npm run tokens:theme`.
const base = baseGenerated as ThemeTokens["colors"]["base"];

const {
  buttonPrimary,
  buttonSecondary,
  buttonGhost,
  buttonDanger,
  buttonRounded,
  iconButton: iconButtonColors,
  linkColors,
  highlightColors,
  breadcrumbColors,
  tableColors,
  siteHeaderColors,
  overlayColors,
  sheetColors,
  sidebarColors,
  popoverColors,
  actionMenuColors,
  pillColors,
  tooltipColors,
} = tokenOutput;

const globalColors = themeFoundation.globalColors;
const generatedShadows = themeFoundation.shadows;
const generatedTypography = themeFoundation.typography as ThemeTokens["typography"];

export const defaultTheme: ThemeTokens = {
  // ── Colors ─────────────────────────────────────────────────────────────────
  colors: {
    base,

    // Component-scoped colors — surface/layout colors live in colors.global (globals.json)
    functional: {
      syntax: globalColors.syntax,

      button: {
        primary: buttonPrimary,
        secondary: buttonSecondary,
        ghost: buttonGhost,
        danger: buttonDanger,
        rounded: buttonRounded,
      },

      iconButton: iconButtonColors,

      link: linkColors,

      highlight: highlightColors,

      breadcrumb: breadcrumbColors,

      table: tableColors,

      siteHeader: siteHeaderColors,

      overlay: overlayColors,

      sheet: sheetColors,

      sidebar: sidebarColors,

      popover: popoverColors,

      actionMenu: actionMenuColors,

      pill: pillColors,

      tooltip: tooltipColors,
    },

    global: globalColors,
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  typography: generatedTypography,

  // ── Sizes ───────────────────────────────────────────────────────────────────
  sizes: {
    ...themeFoundation.sizes,
    ...tokenOutput.sizes,
  },

  // ── Shadows ─────────────────────────────────────────────────────────────────
  shadows: generatedShadows,
};
