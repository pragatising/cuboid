import type { Tokens } from "../mode";

/** Every leaf of a nested token tree as a dot path: `{ a: { b: "x" } }` -> `"a.b"`. */
export type Paths<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];

/** Any foreground colour token: `"neutral.muted"`, `"success.strong"`, `"danger.strong"`… */
export type FgColor = Paths<Tokens["fgColor"]>;
/** Any background colour token: `"canvas.default"`, `"neutral.light.2"`, `"danger.subtle"`… */
export type BgColor = Paths<Tokens["bgColor"]>;
/** Any whole-border token (width, style and colour): `"default"`, `"subtle"`, `"translucent.2"`… */
export type BorderToken = Paths<Tokens["border"]>;
/** Any border colour token: `"default"`, `"subtle"`, `"translucent.3"`… */
export type BorderColor = Paths<Tokens["borderColor"]>;

/** Look a dot path up in one resolved token group of the active mode's tokens (`kind` names it in the error). */
export function resolveColorPath(group: object, path: string, kind = "colour"): string {
  const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], group);
  if (typeof value !== "string") throw new Error(`Unknown ${kind} token "${path}".`);
  return value;
}

// ── Raw CSS values ─────────────────────────────────────────────────────────────────────────────────
// A token is a shortcut, not a fence: wherever a colour or border prop takes a token it also takes any valid CSS value.
// A token wins when the value is one; otherwise the value must look like CSS, so a mistyped token path is still caught.

/** The CSS named colours (CSS Color Module Level 4). */
const NAMED_COLORS = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue",
  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk",
  "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki",
  "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue",
  "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
  "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
  "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow",
  "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
  "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon",
  "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue",
  "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
  "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen",
  "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple",
  "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell",
  "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal",
  "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
] as const;

type ColorKeyword = "transparent" | "currentColor" | "inherit" | "initial" | "unset" | "revert" | "revert-layer";
type ColorFunction = "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "color" | "color-mix" | "light-dark" | "var";

/** A CSS colour written as is: a keyword, a named colour, hex (`"#fff"`), or a colour function (`"rgb(0 0 0 / 50%)"`, `"var(--brand)"`). */
export type CssColor = ColorKeyword | (typeof NAMED_COLORS)[number] | `#${string}` | `${ColorFunction}(${string})`;

const NAMED = new Set<string>(NAMED_COLORS);
const KEYWORDS = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "revert", "revert-layer"]);
const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|var)\(.+\)$/i;

/** True when `value` is a CSS colour: keyword, named colour, hex, or colour function. */
export function isCssColor(value: string): boolean {
  const v = value.trim().toLowerCase();
  return KEYWORDS.has(v) || NAMED.has(v) || HEX_COLOR.test(v) || COLOR_FUNCTION.test(v);
}

function lookup(group: object, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], group);
  return typeof value === "string" ? value : undefined;
}

/** A colour prop's value: a token path in `group`, or a raw CSS colour. Throws on anything that is neither. */
export function resolveColorValue(group: object, value: string): string {
  const token = lookup(group, value);
  if (token !== undefined) return token;
  if (isCssColor(value)) return value;
  throw new Error(`Unknown colour "${value}": it is neither a token path nor a CSS colour.`);
}

const BORDER_STYLE = /\b(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)\b/i;
const BORDER_GLOBAL = /^(inherit|initial|unset|revert|revert-layer|0|var\(.+\))$/i;

/** A whole-border value as CSS writes it: a width, style and colour (`"1px solid red"`), `"none"`, or a keyword. */
export type CssBorder = `${string}${"none" | "hidden" | "dotted" | "dashed" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset"}${string}` | "0" | "inherit" | "initial" | "unset" | "revert" | `var(${string})`;

/** A border prop's value: a `tokens.border` entry, or a raw CSS border. Throws on anything that is neither. */
export function resolveBorderValue(group: object, value: string): string {
  const token = lookup(group, value);
  if (token !== undefined) return token;
  if (BORDER_STYLE.test(value) || BORDER_GLOBAL.test(value.trim())) return value;
  throw new Error(`Unknown border "${value}": it is neither a token path nor a CSS border.`);
}
