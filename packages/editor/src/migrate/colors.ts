import { PILL_SHADES, isPillShade } from "../utils/inline";
import type { HighlightName } from "../utils/palette";
import { isHighlightName } from "../utils/palette";
import type { PillIntensity, PillShade } from "@sragatiping/cuboid";

/**
 * The old editor's colours were ids in its own palette (`fg.teal.1`, `highlight.yellow`); the new document names Cuboid's semantic colours.
 * The old palette is wider, so these map to the nearest one: hue picks the family, and the lightest step becomes the muted form.
 */
const FAMILY_OF_HUE: Record<string, string> = {
  teal: "informational",
  blue: "informational",
  indigo: "informational",
  green: "success",
  red: "danger",
  orange: "warning",
  yellow: "warning",
  purple: "notice",
  magenta: "notice",
  mag: "notice",
};

/** `fg.red.3` → `danger.strong`. Null for a token that names no colour we know. */
export function mapTextColor(token: string): string | null {
  if (token === "text.contrast") return "neutral.contrast";
  if (token === "text.default" || token.startsWith("fg.neutral.")) return "neutral.default";
  if (token === "text.muted" || token === "text.disabled") return "neutral.muted";
  const match = /^fg\.([a-z]+)\.(\d+)$/.exec(token);
  const family = match && FAMILY_OF_HUE[match[1]];
  return family ? `${family}.${Number(match[2]) <= 1 ? "muted" : "strong"}` : null;
}

/**
 * The old `highlight.*` ids, by what they were: the pale yellow is `yellowSoft` and the saturated one (`yellow.sharp`) is `yellow`.
 * A surface that is not a highlight maps by its value: `bg.gray.light.4` is the gray, the rest of the light surfaces are the neutral.
 */
const HIGHLIGHT_OF: Record<string, HighlightName> = { yellow: "yellowSoft", "yellow.sharp": "yellow", gray: "gray", neutral: "neutral" };

export function mapHighlight(token: string): HighlightName {
  if (token === "bg.gray.light.4") return "gray";
  const name = token.startsWith("highlight.") ? token.slice("highlight.".length) : "";
  if (HIGHLIGHT_OF[name]) return HIGHLIGHT_OF[name];
  return isHighlightName(name) ? name : "neutral";
}

const INTENSITY: Record<string, PillIntensity> = { extralight: "extraLight", light: "light", bold: "bold", extrabold: "extraBold" };

/** `blue-bold-b` → a bold, bordered blue pill. Null when the token is not one. */
export function parsePillToken(token: string): { shade: PillShade; intensity: PillIntensity; bordered: boolean } | null {
  const match = /^([a-z]+)-([a-z]+)-([fb])$/.exec(token);
  if (!match || !isPillShade(match[1]) || !PILL_SHADES.includes(match[1]) || !INTENSITY[match[2]]) return null;
  return { shade: match[1], intensity: INTENSITY[match[2]], bordered: match[3] === "b" };
}
