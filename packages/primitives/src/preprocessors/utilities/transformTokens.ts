import type { DesignToken } from "style-dictionary/types";

/**
 * Shared recursive-walk helper preprocessors use to rewrite every real
 * token in a dictionary, leaving group structure untouched. Matches
 * Primer's preprocessors/utilities/transformTokens.ts.
 */
export function transformTokens(token: DesignToken | Record<string, unknown>, transform: (token: DesignToken) => DesignToken): unknown {
  if (typeof token !== "object" || token === null) return token;

  if ("$value" in token || "value" in token) {
    return transform(token as DesignToken);
  }

  const next: Record<string, unknown> = {};
  for (const [prop, value] of Object.entries(token)) {
    next[prop] = transformTokens(value as Record<string, unknown>, transform);
  }
  return next;
}
