/**
 * A hex color string — 3, 6, or 8 hex digits with a leading `#`. Matches
 * the shape validated by schemas/colorHexValue.ts. Kept as a loose
 * `string` alias (not a template-literal type) since TypeScript can't
 * usefully constrain hex-digit patterns at the type level.
 */
export type ColorHex = string;
