/** Parse theme/CSS length strings to pixels (assumes 16px root for rem). */
export function parseLengthPx(value: string, fallback = 0): number {
  if (typeof value !== "string") return fallback;
  if (value.endsWith("rem")) return parseFloat(value) * 16;
  if (value.endsWith("px")) return parseFloat(value);
  if (value.endsWith("vw")) return (parseFloat(value) / 100) * window.innerWidth;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}
