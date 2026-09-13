/**
 * Convert px spacing stops to 8pt grid scale keys (1x = 8px).
 * Used by build-theme.mjs; mirrored in src/utils/spaceScale.ts for runtime.
 */

/** @param {number} px */
export function pxToSpaceScale(px) {
  if (!Number.isFinite(px) || px <= 0) return null;
  const mult = px / 8;
  const formatted = Number.isInteger(mult)
    ? String(mult)
    : String(parseFloat(mult.toFixed(4)));
  return `${formatted}x`;
}

/** @param {string} pxKey — key from space.json ("8", "12", …) */
export function pxKeyToSpaceScale(pxKey) {
  if (!/^\d+$/.test(pxKey)) return null;
  return pxToSpaceScale(Number(pxKey));
}

/**
 * Convert an 8pt scale key ("1.5x") back to its px count (12) — for building
 * a dot-free CSS custom-property *name* (`--cube-space-12px`). Token
 * *values* stay in rem (see theme.json spaceScale) so spacing keeps scaling
 * with the user's OS/browser text-size setting; only the ident is px-named.
 * @param {string} scaleKey — e.g. "1.5x"
 */
export function spaceScaleToPxKey(scaleKey) {
  const match = /^(\d+(?:\.\d+)?)x$/.exec(scaleKey);
  if (!match) return null;
  return String(Number(match[1]) * 8);
}

/**
 * Build the canonical spaceScale map from resolved px-keyed space tokens.
 * @param {Record<string, string>} spacePx
 * @returns {Record<string, string>}
 */
export function buildSpaceScaleFromPxSpace(spacePx) {
  const spaceScale = {};
  for (const pxKey of Object.keys(spacePx)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))) {
    const scaleKey = pxKeyToSpaceScale(pxKey);
    const value = spacePx[pxKey];
    if (scaleKey && typeof value === "string") {
      spaceScale[scaleKey] = value;
    }
  }
  return spaceScale;
}
