/**
 * Rewrites the size scale's px-keyed steps to their Nx names in the JSON
 * output: `size.1` -> `size["0.125x"]`, `size.24` -> `size["3x"]`, where
 * 1x is the 8px base unit.
 *
 * Why the two outputs differ:
 *   - Tokens are AUTHORED by px (`'1'`, `'24'`), because that is what the
 *     value literally is, and because `.` is Style Dictionary's path
 *     separator — authoring `0.125x` would nest the token as
 *     size -> 0 -> 125x and silently break every `{size.…}` reference.
 *   - CSS emits `--cube-size-1px`: a stylesheet author reads the value
 *     directly, no lookup.
 *   - JSON emits `0.125x`: a prop author stays on one proportional scale,
 *     so `gap="0.5x"` and `radius="0.5x"` mean the same step.
 *
 * Only keys under a `size` group that are bare integers are converted, so
 * no other token name can be altered by accident.
 */
const BASE_UNIT_PX = 8;

export function pxKeyToNx(node: unknown, inSizeGroup = false): unknown {
  if (typeof node !== "object" || node === null || Array.isArray(node)) return node;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const isScaleStep = inSizeGroup && /^\d+$/.test(key);
    const nextKey = isScaleStep ? `${Number(key) / BASE_UNIT_PX}x` : key;
    out[nextKey] = pxKeyToNx(value, key === "size");
  }
  return out;
}
