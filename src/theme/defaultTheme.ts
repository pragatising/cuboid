import type { ThemeTokens } from "./types";

const mono =
  "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace";

// Inter is listed first. Consumers must load the font themselves (e.g. Google Fonts,
// Fontsource, or self-hosted). If Inter is unavailable the stack falls back gracefully.
const sansSerif =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

// ── Primitive palette ────────────────────────────────────────────────────────
// Extract as a standalone const so functional tokens can reference stops by
// name (base.red[5]) instead of repeating hex literals everywhere.
const base = {
  gray: {
    0: "#f6f8fa", 1: "#eaeef2", 2: "#d0d7de", 3: "#afb8c1",
    4: "#8c959f", 5: "#6e7781", 6: "#57606a", 7: "#424a53",
    8: "#32383f", 9: "#24292f",
  },
  blue: {
    0: "#ddf4ff", 1: "#cae8ff", 2: "#a5d6ff", 3: "#79c0ff",
    4: "#58a6ff", 5: "#388bfd", 6: "#1f6feb", 7: "#1158c7",
    8: "#0d419d", 9: "#051d4d",
  },
  green: {
    0: "#dafbe1", 1: "#aceebb", 2: "#6fdd8b", 3: "#4ac26b",
    4: "#2da44e", 5: "#1a7f37", 6: "#116329", 7: "#044f1e",
    8: "#003d16", 9: "#002d11",
  },
  red: {
    0: "#ffebe9", 1: "#ffcecb", 2: "#ffaba8", 3: "#ff8182",
    4: "#fa4549", 5: "#cf222e", 6: "#a40e26", 7: "#82071e",
    8: "#660018", 9: "#4c0014",
  },
  orange: {
    0: "#fff1e5", 1: "#ffd8b5", 2: "#ffb77c", 3: "#fb8f44",
    4: "#e16f24", 5: "#bc4c00", 6: "#953800", 7: "#762c00",
    8: "#5c2200", 9: "#471700",
  },
  purple: {
    0: "#fbefff", 1: "#ecd8ff", 2: "#d8b9ff", 3: "#c297ff",
    4: "#a475f9", 5: "#8250df", 6: "#6639ba", 7: "#512a97",
    8: "#3e1f79", 9: "#2e1461",
  },
} as const;

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

export const defaultTheme: ThemeTokens = {
  // ── Colors ─────────────────────────────────────────────────────────────────
  colors: {
    base,

    // Functional tokens — components reference these, never the base scale directly
    functional: {
      background: {
        default:     misc.white,
        muted:       base.gray[0],
        inset:       base.gray[0],
        emphasis:    base.gray[9],
        disabled:    base.gray[0],
        transparent: "transparent",
        inverse:     base.gray[9],
        neutral: {
          muted:    base.gray[1],
          emphasis: base.gray[5],
        },
      },

      foreground: {
        default:    misc.foregroundDefault,
        muted:      misc.foregroundMuted,
        onEmphasis: misc.white,
        disabled:   base.gray[4],
        link:       misc.link,
        white:      misc.white,
        neutral:    base.gray[5],
      },

      border: {
        default:     base.gray[2],
        muted:       misc.borderMuted,
        emphasis:    misc.borderEmphasis,
        disabled:    misc.borderMuted,
        transparent: "transparent",
        translucent: misc.borderTranslucent,
        neutral: {
          muted:    base.gray[2],
          emphasis: base.gray[5],
        },
      },

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

      syntax: {
        comment:                      base.gray[5],
        key:                          misc.syntaxKey,
        constant:                     misc.syntaxConstant,
        constantOtherReferenceLink:   misc.syntaxConstantLink,
        entity:                       base.purple[5],
        entityTag:                    base.green[6],
        keyword:                      base.red[5],
        string:                       misc.syntaxString,
        stringRegexp:                 base.green[6],
        variable:                     base.orange[6],
        brackethighlighterAngle:      base.gray[6],
        brackethighlighterUnmatched:  base.red[7],
        carriageReturnBg:             base.red[5],
        carriageReturnText:           base.gray[0],
        invalidIllegalText:           base.gray[0],
        invalidIllegalBg:             base.red[7],
        markupBold:                   base.gray[9],
        markupItalic:                 base.gray[9],
        markupHeading:                misc.syntaxConstant,
        markupList:                   base.green[6],
        markupInsertedBg:             base.green[0],
        markupInsertedText:           base.green[6],
        markupDeletedBg:              base.red[0],
        markupDeletedText:            base.red[7],
        markupChangedBg:              base.orange[1],
        markupChangedText:            base.orange[6],
        nullLiteral:                  base.gray[4],
        // Both true and false share this colour — purple is the IDE convention
        // for boolean literals. We deliberately avoid green/red because true/false
        // carry no inherent positive/negative meaning in arbitrary data.
        booleanLiteral:               base.purple[5],
        bracket:                      misc.syntaxBracket,
        stringUrl:                    misc.link,
        stringEmail:                  misc.link,
        stringUuid:                   base.gray[5],
        rowHoverBg:                   base.gray[0],
      },
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
    borderRadius: {
      sm:   "0.25rem",   // 4px
      md:   "0.375rem",  // 6px
      lg:   "0.5rem",    // 8px
      xl:   "0.75rem",   // 12px
      full: "9999px",    // pill — intentionally px
    },
    borderWidth: {
      thin:  "1px",  // intentionally px — thinner than 1rem
      thick: "2px",
    },
  },

  // ── Component size compositions ─────────────────────────────────────────────
  // Heights, padding, and icon sizes are all in rem so they scale accessibly.
  //
  //  sm  → 0.1875rem*2 + 1rem     + 2px border ≈ 24px total
  //  md  → 0.3125rem*2 + 1.25rem  + 2px border ≈ 32px total
  //  lg  → 0.5625rem*2 + 1.25rem  + 2px border ≈ 40px total
  components: {
    button: {
      sm: { height: "1.5rem",  paddingX: "0.4375rem", paddingY: "0.1875rem", fontSize: "0.75rem",  lineHeight: "1rem",    iconGap: "0.25rem"  },
      md: { height: "2rem",    paddingX: "0.6875rem", paddingY: "0.3125rem", fontSize: "0.875rem", lineHeight: "1.25rem", iconGap: "0.375rem" },
      lg: { height: "2.5rem",  paddingX: "0.9375rem", paddingY: "0.5625rem", fontSize: "1rem",     lineHeight: "1.25rem", iconGap: "0.5rem"   },
    },
    iconButton: {
      sm: { size: "1.5rem",  iconSize: "1rem"    },  // 24px outer, 16px icon
      md: { size: "2rem",    iconSize: "1.25rem" },  // 32px outer, 20px icon
    },
  },
};
