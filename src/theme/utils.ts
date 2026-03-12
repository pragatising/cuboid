/**
 * Deep-merges `override` on top of `base`.
 * Only plain objects are merged recursively — primitives, arrays, and null
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
      typeof baseVal === "object" &&
      baseVal !== null &&
      !Array.isArray(baseVal);

    result[key] = bothAreObjects
      ? (deepMerge(baseVal as object, overrideVal as object) as T[keyof T])
      : (overrideVal as T[keyof T]);
  }

  return result;
}
