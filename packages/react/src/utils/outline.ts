const cache = new Map<string, boolean>();

/** Parses what a browser resolves a colour to: `rgb(…)`, `rgba(…)` or `color(srgb r g b / a)`. Null for anything else. */
function parse(resolved: string): { r: number; g: number; b: number; a: number } | null {
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/.exec(resolved);
  if (rgb) return { r: +rgb[1] / 255, g: +rgb[2] / 255, b: +rgb[3] / 255, a: rgb[4] === undefined ? 1 : rgb[5] ? +rgb[4] / 100 : +rgb[4] };
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(resolved);
  if (srgb) return { r: +srgb[1], g: +srgb[2], b: +srgb[3], a: srgb[4] === undefined ? 1 : srgb[5] ? +srgb[4] / 100 : +srgb[4] };
  return null;
}

/** The relative luminance of an sRGB colour (0 black, 1 white). */
const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/**
 * Whether a swatch of this CSS colour needs an outline to be seen on a page: it is close to white, or mostly transparent. Anything else
 * stands out from the page by itself, and a border there is only a ring round it, so it should be the colour's own. Asks the browser what the
 * colour is (so a name, a hex, `hsl(…)` and `rgb(…)` are all read alike); false where that is not possible (no document, a `var(…)`, a
 * function the browser keeps as it is), since a missing outline is a smaller fault than a wrong one on every swatch.
 */
export function needsOutline(color: string): boolean {
  const known = cache.get(color);
  if (known !== undefined) return known;
  let answer = false;
  if (typeof document !== "undefined" && !/^var\(|^inherit|^initial|^unset|^revert|^currentcolor$/i.test(color.trim())) {
    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const parsed = parse(getComputedStyle(probe).color);
    probe.remove();
    answer = parsed !== null && (parsed.a < 0.6 || luminance(parsed) > 0.8);
  }
  cache.set(color, answer);
  return answer;
}
