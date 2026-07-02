import type { SpaceScale } from "../theme/types";

/** Convert a pixel count to an 8pt grid scale key (`1x` = 8px). */
export function pxToSpaceScale(px: number): SpaceScale | null {
  if (!Number.isFinite(px) || px <= 0) return null;
  const mult = px / 8;
  const formatted = Number.isInteger(mult)
    ? String(mult)
    : String(parseFloat(mult.toFixed(4)));
  return `${formatted}x` as SpaceScale;
}

/** Convert a `space.json` px key (`"12"`) to a scale key (`"1.5x"`). */
export function pxKeyToSpaceScale(pxKey: string): SpaceScale | null {
  if (!/^\d+$/.test(pxKey)) return null;
  return pxToSpaceScale(Number(pxKey));
}
