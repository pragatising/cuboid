/**
 * The DTCG structured shadow shape: one shadow layer object, or an array of
 * them for stacked shadows (e.g. today's popover shadow, which is 3 layers
 * joined into one CSS string — see DESIGN.md §1 and
 * tokens/functional/shadows/shadows.json for the current pre-joined form
 * this replaces). Matches Primer's shadowTokenValue.d.ts scope.
 *
 * Not yet implemented — stub only.
 */
export type ShadowLayer = unknown; // TODO: { color, offsetX, offsetY, blur, spread }
export type ShadowTokenValue = unknown; // TODO: ShadowLayer | ShadowLayer[]
