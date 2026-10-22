/**
 * A resolved token value (the CSS string the token build produced, e.g. `"0.5rem"` or `"#3a3a3933"`) handed to a prop whose
 * type only admits checked values (a token key, a scale step, a recognised CSS colour or length).
 *
 * The type system sees every resolved token as a plain `string`, so it cannot tell it is valid; the build and the token
 * schemas already did. This is that statement made explicit, in one greppable place, instead of a cast at each use. The
 * target type is inferred from where the value goes: `<Box backgroundColor={resolved(overlay.color.modal)} />`.
 *
 * Box still validates the value at runtime, so a wrong one fails loudly rather than silently.
 */
export function resolved<T>(value: string): T {
  return value as T;
}
