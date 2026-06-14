import type { ThemeTokens } from "./types";
import themeGenerated from "./output/theme.json";
import baseGenerated from "./output/base.json";

// ── Primitive palette ────────────────────────────────────────────────────────
// Generated from tokens/base/light.json via `npm run tokens:theme`.
const base = baseGenerated as ThemeTokens["colors"]["base"];

const generatedFunctional = themeGenerated.colors.functional;

const buttonPrimary = themeGenerated.buttonPrimary;
const buttonSecondary = themeGenerated.buttonSecondary;
const buttonGhost = themeGenerated.buttonGhost;
const buttonDanger = themeGenerated.buttonDanger;
const buttonRounded = themeGenerated.buttonRounded;
const iconButtonColors = themeGenerated.iconButton;
const linkColors = themeGenerated.linkColors;
const breadcrumbColors = themeGenerated.breadcrumbColors;
const siteHeaderColors = themeGenerated.siteHeaderColors;
const overlayColors = themeGenerated.overlayColors;
const sheetColors = themeGenerated.sheetColors;
const pillColors = themeGenerated.pillColors;
const tooltipColors = themeGenerated.tooltipColors;
const globalColors = themeGenerated.globalColors;
const generatedSizes = themeGenerated.sizes;
const generatedShadows = themeGenerated.shadows;
const generatedTypography = themeGenerated.typography as ThemeTokens["typography"];

export const defaultTheme: ThemeTokens = {
  // ── Colors ─────────────────────────────────────────────────────────────────
  colors: {
    base,

    // Functional tokens — components reference these, never the base scale directly
    functional: {
      background: generatedFunctional.background,
      foreground: generatedFunctional.foreground,
      border: generatedFunctional.border,

      syntax: generatedFunctional.syntax,

      button: {
        primary: buttonPrimary,
        secondary: buttonSecondary,
        ghost: buttonGhost,
        danger: buttonDanger,
        rounded: buttonRounded,
      },

      iconButton: iconButtonColors,

      link: linkColors,

      breadcrumb: breadcrumbColors,

      siteHeader: siteHeaderColors,

      overlay: overlayColors,

      sheet: sheetColors,

      pill: pillColors,

      tooltip: tooltipColors,
    },

    global: globalColors,
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  typography: generatedTypography,

  // ── Sizes ───────────────────────────────────────────────────────────────────
  sizes: generatedSizes,

  // ── Shadows ─────────────────────────────────────────────────────────────────
  shadows: generatedShadows,
};
