/**
 * DTCG structured shadow object(s) -> one CSS box-shadow string, joining
 * multiple layers with commas. This is the one real reshaping step in the
 * new pipeline (see DESIGN.md §1/§3) — today's shadows.json stores a
 * pre-joined CSS string directly; the new format stores structured
 * {color, offsetX, offsetY, blur, spread} data and this function does the
 * joining at CSS-emission time instead of at authoring time. Matches
 * Primer's transformers/shadowToCss.ts.
 *
 * Not yet implemented — stub only.
 */
export function shadowToCss(_value: unknown): string {
  throw new Error("not implemented");
}
