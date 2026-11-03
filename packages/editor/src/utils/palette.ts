/**
 * The colours text can have, as names, not as CSS: a document stores `danger.strong` or `yellow`, and the page resolves it through
 * Cuboid's variables, so the same document reads correctly in light and dark mode and follows a re-themed system.
 */
export type PaletteColor = { value: string; label: string; /** CSS the swatch is drawn in. */ color: string };
export type PaletteGroup = { label: string; colors: PaletteColor[] };

/** `danger.strong` → `var(--cube-fgColor-danger-strong)`. */
export const textColorVar = (value: string) => `var(--cube-fgColor-${value.replace(/\./g, "-")})`;

const text = (value: string, label: string): PaletteColor => ({ value, label, color: textColorVar(value) });

const FAMILIES = ["informational", "success", "warning", "danger", "notice"] as const;
const titled = (word: string) => word[0].toUpperCase() + word.slice(1);

export const TEXT_COLOR_GROUPS: PaletteGroup[] = [
  { label: "Neutral", colors: [text("neutral.contrast", "Default"), text("neutral.default", "Body"), text("neutral.muted", "Muted")] },
  ...FAMILIES.map((family) => ({ label: titled(family), colors: [text(`${family}.strong`, `${titled(family)}`), text(`${family}.muted`, `${titled(family)} (muted)`)] })),
];

/** Cuboid's highlight colours, in the order a grid shows them: the quiet ones first, then by hue, the strong yellow and lime last. */
export const HIGHLIGHT_NAMES = ["neutral", "gray", "blue", "teal", "green", "yellowSoft", "yellow", "orange", "red", "magenta", "purple", "lime"] as const;
export type HighlightName = (typeof HIGHLIGHT_NAMES)[number];

/** What a person calls them. `yellow` is the saturated marker, `yellowSoft` the pale one. */
export const HIGHLIGHT_LABELS: Record<HighlightName, string> = {
  neutral: "Neutral",
  gray: "Gray",
  blue: "Blue",
  teal: "Teal",
  green: "Green",
  yellowSoft: "Yellow",
  yellow: "Yellow (strong)",
  orange: "Orange",
  red: "Red",
  magenta: "Magenta",
  purple: "Purple",
  lime: "Lime",
};

/** The background and text colour of a highlight, as Cuboid's `highlight` tokens give them. */
export const highlightVars = (name: string) => ({ background: `var(--cube-highlight-${name}-bgColor)`, color: `var(--cube-highlight-${name}-fgColor)` });

export const HIGHLIGHT_GROUPS: PaletteGroup[] = [
  { label: "Highlight", colors: HIGHLIGHT_NAMES.map((name) => ({ value: name, label: HIGHLIGHT_LABELS[name], color: highlightVars(name).background })) },
];

const TEXT_VALUES = new Set(TEXT_COLOR_GROUPS.flatMap((g) => g.colors.map((c) => c.value)));
export const isTextColor = (value: unknown): value is string => typeof value === "string" && TEXT_VALUES.has(value);
export const isHighlightName = (value: unknown): value is HighlightName => HIGHLIGHT_NAMES.includes(value as HighlightName);
