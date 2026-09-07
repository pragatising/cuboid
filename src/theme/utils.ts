/**
 * Structural check for values like {@link IconLibrary} — an object whose
 * whole identity/behavior lives in a `resolve` method, not in enumerable
 * data keys meant to be merged. Recursing into these key-by-key (as we do
 * for ordinary token objects) would splice properties from whichever side
 * happens to have extras onto the other side's `resolve`, corrupting a
 * theme-level library swap. Such values must replace wholesale instead.
 */
function isOpaqueMergeValue(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { resolve?: unknown }).resolve === "function"
  );
}

/**
 * Deep-merges `override` on top of `base`.
 * Only plain objects are merged recursively — primitives, arrays, null, and
 * "opaque" values (see {@link isOpaqueMergeValue}, e.g. `theme.icon.library`)
 * are replaced wholesale. Missing keys in `override` keep the `base` value.
 */
export function deepMerge<T extends object>(base: T, override: Partial<T> | undefined): T {
  if (!override) return base;

  const result = { ...base } as T;

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideVal = override[key];
    if (overrideVal === undefined) continue;

    const baseVal = base[key];
    const bothAreObjects =
      typeof overrideVal === "object" &&
      overrideVal !== null &&
      !Array.isArray(overrideVal) &&
      !isOpaqueMergeValue(overrideVal) &&
      typeof baseVal === "object" &&
      baseVal !== null &&
      !Array.isArray(baseVal) &&
      !isOpaqueMergeValue(baseVal);

    result[key] = bothAreObjects
      ? (deepMerge(baseVal as object, overrideVal as object) as T[keyof T])
      : (overrideVal as T[keyof T]);
  }

  return result;
}
