import type { SwatchGroup } from "../../../src";
import { colorGroups, resolveColorValue } from "../../../src/utils/colorPaths";
import type { Tokens } from "../../../src/mode";

/** Which scale a colour prop's tokens are in: a background, a border, or (anything else) a foreground, as Box resolves them. */
export type Scale = "fgColor" | "bgColor" | "borderColor";

export const scaleOf = (propName: string): Scale =>
  /background/i.test(propName)
    ? "bgColor"
    : /border/i.test(propName)
      ? "borderColor"
      : "fgColor";

/** The shade of a palette family that stands for it in a swatch: strong enough to read as the hue. */
const SHADE = "7";

/**
 * The CSS colour a value is drawn in, or null when it has none (`none`, `inherit`, `var(--x)` which the page defines). A token path or a
 * CSS colour as the library resolves them; a palette family on its own (`green`) as one shade of it; a semantic name (`danger`) as its
 * default. `family` puts the palette first, for a choice of families (Pill's `shade`), where `green` means the palette's, not CSS's.
 */
export function swatchColor(
  tokens: Tokens,
  value: string | number,
  scale: Scale,
  family = false,
): string | null {
  const text = String(value);
  const groups = colorGroups(tokens);
  const ofFamily = () => {
    const shade = (
      tokens.display as unknown as Record<string, Record<string, unknown>>
    )[text]?.[SHADE];
    if (typeof shade === "string") return shade;
    const semantic = (groups[scale] as Record<string, Record<string, unknown>>)[
      text
    ]?.default;
    return typeof semantic === "string" ? semantic : null;
  };
  if (family) {
    const found = ofFamily();
    if (found !== null) return found;
  }
  try {
    const resolved = resolveColorValue(groups[scale], text);
    return /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i.test(
      resolved,
    ) || resolved.startsWith("var(")
      ? null
      : resolved;
  } catch {
    return ofFamily();
  }
}

/** Whether a prop is a choice of colours: it is named for one, and most of its values are colours. */
export function isColorEnum(
  propName: string,
  values: (string | number)[],
  tokens: Tokens,
): boolean {
  if (!/colou?r|shade|tone|hue/i.test(propName)) return false;
  const scale = scaleOf(propName);
  const colours = values.filter(
    (value) => swatchColor(tokens, value, scale, true) !== null,
  ).length;
  return values.length > 0 && colours / values.length >= 0.6;
}

/**
 * Values as swatches, grouped by the family a token path starts with (`neutral.muted` is in `neutral`), so a long set reads as the
 * scale it is. Values with no colour (`none`, `var(--x)`) are left out: there is nothing to draw.
 */
export function swatchGroups(
  tokens: Tokens,
  values: (string | number)[],
  scale: Scale,
  options: { ungrouped?: string; family?: boolean } = {},
): SwatchGroup[] {
  const { ungrouped = "Colours", family: families = false } = options;
  const groups = new Map<string, SwatchGroup>();
  for (const value of values) {
    const color = swatchColor(tokens, value, scale, families);
    if (color === null) continue;
    const text = String(value);
    const group_ = text.includes(".")
      ? text.slice(0, text.indexOf("."))
      : ungrouped;
    const group = groups.get(group_) ?? { label: group_, swatches: [] };
    group.swatches.push({ value: text, color });
    groups.set(group_, group);
  }
  return [...groups.values()];
}

/** Whether a set of values is colours: the named sets (`FgColor`, `CssColor`…) are, and so is any set most of whose values are. */
export function isColorSet(
  name: string,
  values: (string | number)[],
  tokens: Tokens,
  scale: Scale,
): boolean {
  if (/color|colour/i.test(name)) return true;
  const colours = values.filter(
    (value) => swatchColor(tokens, value, scale) !== null,
  ).length;
  return values.length > 0 && colours / values.length >= 0.6;
}
