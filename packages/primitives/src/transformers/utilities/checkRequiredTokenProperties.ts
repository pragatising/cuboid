/**
 * Asserts a token object has the properties a given $type requires (e.g. a
 * color leaf needs $value + $type, nothing else optional-but-assumed).
 * Called by the per-$type schemas in schemas/ before a transformer ever
 * touches the value — this is the generic replacement for build-theme.mjs's
 * hand-written `isPlain(btn) || !isPlain(btn.bgColor)`-style checks that
 * used to exist once per component.
 *
 * Not yet implemented — stub only.
 */
export function checkRequiredTokenProperties(_token: unknown): void {
  throw new Error("not implemented");
}
