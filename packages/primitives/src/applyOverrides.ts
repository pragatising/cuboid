/**
 * Runtime token override merge — the mechanism ADR-04
 * (docs/adr/adr-04-token-consumption-shape.md) decided on for re-theming:
 * a plain object merge, called once by the consuming app (e.g. in its own
 * src/theme.ts, before anything renders), never from inside a component
 * and never behind a React context/hook. No dependency on React, Style
 * Dictionary, or anything else in this package — this file is intentionally
 * a self-contained, zero-dependency utility.
 *
 * Merge rule: plain nested objects merge key-by-key, recursively. Anything
 * else — a string, a number, an array — is a full replacement, never
 * merged. Arrays are deliberately NOT merged by index: a shadow token's
 * `$value` is an array of layer objects, and index-merging would silently
 * produce a layer that mixes one override's color with another's offset.
 * An override of an array token must supply the whole array.
 */

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function applyOverrides<T extends PlainObject>(base: T, overrides: PlainObject): T {
  const result: PlainObject = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const baseValue = result[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = applyOverrides(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result as T;
}
