import type { ThemeTokens } from "./types";
import themeGenerated from "./output/theme.json";
import baseGenerated from "./output/base.json";

// ── Primitive palette ────────────────────────────────────────────────────────
// Generated from tokens/base/light.json via `npm run tokens:theme`.
const base = baseGenerated as ThemeTokens["colors"]["base"];

const generatedFunctional = themeGenerated.colors.functional;

const buttonPrimary = themeGenerated.buttonPrimary;
const buttonSecondary = themeGenerated.buttonSecondary;
const buttonDanger = themeGenerated.buttonDanger;
const buttonRounded = themeGenerated.buttonRounded;
const iconButtonColors = themeGenerated.iconButton;
const tooltipColors = themeGenerated.tooltipColors;
const generatedSizes = themeGenerated.sizes;
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

      button: {
        primary: buttonPrimary,
        secondary: buttonSecondary,
        danger: buttonDanger,
        rounded: buttonRounded,
      },

      iconButton: iconButtonColors,

      syntax: generatedFunctional.syntax,

      tooltip: tooltipColors,
    },
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  typography: generatedTypography,

  // ── Sizes ───────────────────────────────────────────────────────────────────
  sizes: generatedSizes,
};
