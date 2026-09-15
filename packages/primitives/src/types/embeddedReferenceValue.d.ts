/**
 * A $value that is NOT purely a {path} reference but a larger string with
 * one or more {path} references embedded inside it — real, found in
 * tokens/functional/size/border.json: "inset 0 0 0 {borderWidth.thicker}".
 *
 * This is a genuinely different case from a pure reference (where the
 * entire $value is "{path}"): resolving it means finding and substituting
 * every {...} substring inside the string, not replacing the whole value.
 * DESIGN.md's original resolver design (a fixed-point loop checking
 * `/^\{[^}]+\}$/` — whole-string match only) does not handle this shape;
 * the resolver needs a second pass (or a combined regex) for embedded
 * references before this migration can call itself complete.
 *
 * Not yet implemented — stub only.
 */
export type EmbeddedReferenceValue = string; // TODO: string containing one or more {path} substrings
