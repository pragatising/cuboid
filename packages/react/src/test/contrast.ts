/** WCAG 2.x relative luminance and contrast ratio of two `#rrggbb` colours. jsdom cannot compute contrast, so token pairs are checked here. */
const channel = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

function luminance(hex: string) {
  const h = hex.replace("#", "").slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
