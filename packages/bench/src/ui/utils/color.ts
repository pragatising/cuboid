/** A colour as hue (0-360), saturation and brightness (both 0-1): the model a gradient area and a hue slider edit. */
export type Hsv = { h: number; s: number; v: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const hex2 = (value: number) => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, "0");

/** `#abc` or `#aabbcc` (any case) to `#aabbcc`, or `undefined` when it is not a hex colour. */
export function normalizeHex(value: string): string | undefined {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return undefined;
  const digits = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${digits.toLowerCase()}`;
}

export function hexToHsv(hex: string): Hsv | undefined {
  const normal = normalizeHex(hex);
  if (!normal) return undefined;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(normal.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${hex2(f(5))}${hex2(f(3))}${hex2(f(1))}`;
}
