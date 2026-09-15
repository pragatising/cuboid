/**
 * Given a resolved token tree and a dot-path, return that token's $value —
 * the read side of the {path} reference resolver (the write/substitution
 * side is the fixed-point resolve loop in preprocessors/, see DESIGN.md
 * §2 step 2). Matches build-theme.mjs's existing getPath()/resolveOnce()
 * logic, generalized to not assume any particular tree shape.
 *
 * Not yet implemented — stub only.
 */
export function getTokenValue(_root: unknown, _path: string): unknown {
  throw new Error("not implemented");
}
