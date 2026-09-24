/**
 * The 13 standard $type values from the W3C DTCG spec (see
 * docs/knowledge/w3c-design-token.md), plus `custom-string` — Primer's
 * own extension for a raw CSS value with no reference or that embeds a
 * reference inside a larger string (e.g. `"inset 0 0 0 {borderWidth.thin}"`,
 * `"clamp(6.5rem, 25%, 10rem)"`).
 *
 * Corrected 2026-09-23 (was wrong): an earlier version of this comment
 * claimed cuboid had "no equivalent need" for Primer's custom-string —
 * checking real token files found 4 confirmed uses
 * (functional/size/layout.json5, functional/size/border.json5) for
 * exactly this case. `custom-viewportRange` has zero confirmed uses in
 * cuboid's real token files — its schema (viewportRangeToken.ts) is
 * still built as real infrastructure, per the standing instruction that
 * "deferred" never means "not built."
 */
export const validTokenTypes = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "strokeStyle",
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
  "custom-string",
  "custom-viewportRange",
] as const;

export type TokenType = (typeof validTokenTypes)[number];

export function isValidTokenType(value: unknown): value is TokenType {
  return typeof value === "string" && (validTokenTypes as readonly string[]).includes(value);
}
