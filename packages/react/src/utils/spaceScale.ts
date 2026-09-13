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

/**
 * Convert an 8pt scale key (`"1.5x"`) back to its px count (`"12"`) — for
 * building a dot-free CSS custom-property *name* (`--cube-space-12px`).
 * Token *values* stay in rem so spacing keeps scaling with the user's
 * OS/browser text-size setting; only the ident is px-named.
 */
export function spaceScaleToPxKey(scaleKey: SpaceScale): string | null {
  const match = /^(\d+(?:\.\d+)?)x$/.exec(scaleKey);
  if (!match) return null;
  return String(Number(match[1]) * 8);
}
