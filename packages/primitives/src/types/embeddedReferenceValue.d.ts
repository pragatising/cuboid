/**
 * A $value that is not purely a whole-value {path} reference, but a
 * larger string with one or more {path} references embedded inside it —
 * real, confirmed usage: `functional/size/border.json5`'s
 * `boxShadow.thin` ("inset 0 0 0 {borderWidth.thin}") and
 * `functional/size/layout.json5`'s `sectionLabelWidth`
 * ("clamp(6.5rem, 25%, 10rem)", no reference at all — a plain string).
 *
 * Unlike a pure reference (referenceValue.ts's whole-string-match shape),
 * resolving this means finding and substituting every {...} substring
 * inside the string, not replacing the whole value. This is handled
 * natively — Style Dictionary's reference resolver does exactly this
 * kind of embedded substitution internally (verified directly against
 * node_modules/style-dictionary/lib/utils/references/resolveReferences.js,
 * see DESIGN.md §3); no custom resolver logic is needed on cuboid's side.
 * `schemas/stringToken.ts` (Primer's `custom-string` $type) is the real
 * schema covering this shape.
 */
export type EmbeddedReferenceValue = string;
