/**
 * px → rem, honoring an optional SIZE_BASE_PX override (defaults to the
 * browser's 16px root). Matches cuboid's existing px-to-rem formula.
 */
const PX_TO_REM_BASE = Number(process.env.SIZE_BASE_PX ?? 16);

const PX_PATTERN = /^(\d+(?:\.\d+)?)px$/;

export function isPxDimension(value: unknown): value is string {
  return typeof value === "string" && PX_PATTERN.test(value);
}

export function dimensionToRem(value: string): string {
  const match = value.match(PX_PATTERN);
  if (!match) {
    throw new Error(`dimensionToRem: expected a "<number>px" string, got ${JSON.stringify(value)}`);
  }
  const px = Number(match[1]);
  const rem = Math.round((px / PX_TO_REM_BASE) * 10000) / 10000;
  return `${rem}rem`;
}
