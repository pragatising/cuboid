import type { ThemeTokens } from "./types";
import themeGenerated from "./defaultTheme.generated.json";

const mono =
  "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace";

// Inter is listed first. Consumers must load the font themselves (e.g. Google Fonts,
// Fontsource, or self-hosted). If Inter is unavailable the stack falls back gracefully.
const sansSerif =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

// ── Primitive palette ────────────────────────────────────────────────────────
// Generated from tokens/base/light.json via `npm run tokens:theme`.
const base = themeGenerated.base as ThemeTokens["colors"]["base"];

// Colors that fall between palette stops (GitHub Primer specifics).
// Named so they're easy to update when switching palettes.
const misc = {
  white:              "#ffffff",
  foregroundDefault:  "#1f2328",  // slightly off-black, just below gray[9]
  foregroundMuted:    "#656d76",  // between gray[5] and gray[6]
  borderEmphasis:     "#636c76",  // near gray[5]
  borderMuted:        "hsla(210,18%,87%,1)",
  borderTranslucent:  "rgba(208,215,222,0.5)",
  bgInset:            "#f0f2f4",  // just below gray[0]
  link:               "#0969da",  // between blue[6] and blue[7]
  syntaxConstant:     "#09B2B5",  // deep blue, between blue[7] and blue[8]
  syntaxKey:          "#646CB8",  // deep blue, between blue[7] and blue[8]
  syntaxBracket:      "#E01280",  // deep blue, between blue[7] and blue[8]
  syntaxParenthesis:  "#BF8D04",  // deep blue, between blue[7] and blue[8]
  syntaxConstantLink: "#0a3069",  // very deep blue
  syntaxString:       "#B96516",  // burnt orange, between orange[4] and orange[5]
} as const;

const buttonPrimary = themeGenerated.buttonPrimary;
const buttonSecondary = themeGenerated.buttonSecondary;
const buttonSizeBase = themeGenerated.buttonSizeBase;
const generatedSizes = themeGenerated.sizes;
const generatedFunctional = themeGenerated.colors.functional;

export const defaultTheme: ThemeTokens = {
  // ── Colors ─────────────────────────────────────────────────────────────────
  colors: {
    base,

    // Functional tokens — components reference these, never the base scale directly
    functional: {
      background: generatedFunctional.background,
      foreground: generatedFunctional.foreground,
      border: generatedFunctional.border,

      shadow: {
        resting: {
          xsmall: "0 1px 0 rgba(31,35,40,0.04)",
          small:  "0 1px 0 rgba(31,35,40,0.04), 0 3px 6px rgba(57,59,68,0.12)",
          medium: "0 3px 6px rgba(140,149,159,0.15)",
        },
        floating: {
          small:  "0 1px 1px rgba(31,35,40,0.1), 0 8px 24px rgba(66,74,83,0.12)",
          medium: "0 3px 12px rgba(140,149,159,0.2), 0 6px 24px rgba(66,74,83,0.15)",
          large:  "0 8px 24px rgba(140,149,159,0.2)",
          xlarge: "0 12px 48px rgba(140,149,159,0.3)",
        },
        inset: "inset 0 1px 0 rgba(208,215,222,0.2)",
      },

      danger: {
        bg:         base.red[5],
        bgHover:    base.red[6],
        bgMuted:    base.red[0],
        fg:         misc.white,
        fgOnSubtle: base.red[5],
        border:     base.red[5],
      },

      button: {
        primary: buttonPrimary,
        secondary: buttonSecondary,
      },

      syntax: generatedFunctional.syntax,
    },
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  typography: {
    fontFamily: { base: sansSerif, mono },

    fontSize: {
      xs:  "0.75rem",   // 12px
      sm:  "0.875rem",  // 14px
      md:  "1rem",      // 16px
      lg:  "1.25rem",   // 20px
      xl:  "1.5rem",    // 24px
      xxl: "2rem",      // 32px
    },

    fontWeight: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },

    lineHeight: {
      tight:   1.25,
      normal:  1.5,
      relaxed: 1.75,
    },

    // Functional text styles — mirrors the Primer typography levels
    text: {
      display:      { fontSize: "2rem",     fontWeight: 600, lineHeight: 1.25 },
      titleLarge:   { fontSize: "1.5rem",   fontWeight: 600, lineHeight: 1.25 },
      titleMedium:  { fontSize: "1.25rem",  fontWeight: 600, lineHeight: 1.25 },
      titleSmall:   { fontSize: "1rem",     fontWeight: 600, lineHeight: 1.5  },
      subtitle:     { fontSize: "1rem",     fontWeight: 400, lineHeight: 1.5  },
      bodyLarge:    { fontSize: "1rem",     fontWeight: 400, lineHeight: 1.75 },
      bodyMedium:   { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5  },
      bodySmall:    { fontSize: "0.75rem",  fontWeight: 400, lineHeight: 1.5  },
      caption:      { fontSize: "0.75rem",  fontWeight: 400, lineHeight: 1.25 },
      codeBlock:    { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.25, fontFamily: mono },
      inlineCode:   { fontSize: "0.875em",  fontWeight: 400, lineHeight: 1.5,  fontFamily: mono },
    },
  },

  // ── Sizes ───────────────────────────────────────────────────────────────────
  // All values in rem so they scale when the user changes their browser font size.
  // Exception: borderWidth stays in px — 1px and 2px are intentionally sub-rem.
  sizes: {
    space: {
      1:  "0.25rem",  // 4px
      2:  "0.5rem",   // 8px
      3:  "0.75rem",  // 12px
      4:  "1rem",     // 16px
      5:  "1.25rem",  // 20px
      6:  "1.5rem",   // 24px
      8:  "2rem",     // 32px
      10: "2.5rem",   // 40px
      12: "3rem",     // 48px
    },
    borderRadius: generatedSizes.borderRadius,
    borderWidth: generatedSizes.borderWidth,
  },

  // ── Component size compositions ─────────────────────────────────────────────
  // Heights, padding, and icon sizes are all in rem so they scale accessibly.
  //
  //  sm  → 0.1875rem*2 + 1rem     + 2px border ≈ 24px total
  //  md  → 0.3125rem*2 + 1.25rem  + 2px border ≈ 32px total
  //  lg  → 0.5625rem*2 + 1.25rem  + 2px border ≈ 40px total
  components: {
    button: {
      sm: {
        ...buttonSizeBase.sm,
        fontSize: "0.75rem",
        lineHeight: "1rem",
      },
      md: {
        ...buttonSizeBase.md,
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      },
      lg: {
        ...buttonSizeBase.lg,
        fontSize: "1rem",
        lineHeight: "1.25rem",
      },
    },
    iconButton: {
      sm: { size: "1.5rem",  iconSize: "1rem"    },  // 24px outer, 16px icon
      md: { size: "2rem",    iconSize: "1.25rem" },  // 32px outer, 20px icon
    },
  },
};
