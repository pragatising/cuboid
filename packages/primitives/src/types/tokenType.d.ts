/**
 * The five $type values cuboid's actual token set needs (verified against
 * all 45 current token files — see DESIGN.md §1). Every token schema, every
 * transformer's filter, and every format's per-type branch keys off this.
 *
 * Deliberately NOT Primer's full type list (no cubicBezier, duration,
 * transition, gradient, border-as-a-type) — those don't exist in cuboid's
 * token set yet. Add one here only when a real token needs it.
 *
 * Not yet implemented — stub only.
 */
export type TokenType = "color" | "dimension" | "number" | "fontFamily" | "shadow"; // TODO
