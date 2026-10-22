/** The root font size rem resolves against: the browser default. */
const REM_BASE_PX = 16;

/** A token length (`"0.125rem"` or `"2px"`) in pixels; `fallback` for anything else. */
export function lengthToPx(value: string, fallback = 0): number {
  if (value.endsWith("rem")) return parseFloat(value) * REM_BASE_PX;
  if (value.endsWith("px")) return parseFloat(value);
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}
