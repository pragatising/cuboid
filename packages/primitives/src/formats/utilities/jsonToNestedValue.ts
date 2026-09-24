/**
 * Rebuilds a nested tree where every leaf is collapsed to its resolved
 * value (dropping $type/$description/$extensions wrappers). This is the
 * shape `defaultTheme.ts` actually wants — a plain resolved tree, not
 * DTCG-wrapped leaves. Matches Primer's
 * formats/utilities/jsonToNestedValue.ts.
 */
export function jsonToNestedValue(token: unknown): unknown {
  if (typeof token !== "object" || token === null) return token;

  const obj = token as Record<string, unknown>;
  if ("$value" in obj) return obj.$value;
  if ("value" in obj) return obj.value;

  const next: Record<string, unknown> = {};
  for (const [prop, value] of Object.entries(obj)) {
    next[prop] = jsonToNestedValue(value);
  }
  return next;
}
