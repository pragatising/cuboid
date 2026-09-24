/**
 * Wraps a single value or an existing array into an array uniformly,
 * dropping falsy entries. Matches Primer's utilities/asArray.ts — used
 * wherever a config option accepts either one value or many (e.g. a
 * theme name, or `[currentTheme, fallbackTheme]`).
 */
export function asArray<T>(item: T | T[]): T[] {
  return (Array.isArray(item) ? item : [item]).filter(Boolean) as T[];
}
