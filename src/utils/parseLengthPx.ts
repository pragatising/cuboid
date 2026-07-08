/**
 * Root font-size (px) that rem is resolved against — the browser default.
 * Must match `PX_TO_REM_BASE` in scripts/build-theme.mjs, which generates
 * cuboid's `--cube-*` rem values against this same base.
 */
export const REM_BASE_PX = 16;

/** Parse theme/CSS length strings to pixels. */
export function parseLengthPx(value: string, fallback = 0): number {
  if (typeof value !== "string") return fallback;
  if (value.endsWith("rem")) return parseFloat(value) * REM_BASE_PX;
  if (value.endsWith("px")) return parseFloat(value);
  if (value.endsWith("vw")) return (parseFloat(value) / 100) * window.innerWidth;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}
