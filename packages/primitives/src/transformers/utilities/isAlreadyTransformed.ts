/**
 * True if a value has already been converted to its final CSS-string
 * shape by an earlier pass of the same transform.
 *
 * Why this exists — the real mechanism, verified against Style
 * Dictionary's own source (lib/transform/map.js, lib/transform/token.js,
 * StyleDictionary.js's `_exportPlatform` while-loop):
 *
 * Style Dictionary resolves references and transforms values in the SAME
 * repeated pass over one shared token map. Each pass it (1) transforms
 * every token whose value currently holds no `{reference}`, then (2)
 * resolves references, which unblocks more tokens for the next pass. A
 * transform marked `transitive: true` opts INTO running on a value that
 * arrived by reference resolution.
 *
 * So for an alias chain within a single layer:
 *
 *   layout.pageMaxWidth        $value: {value: 56, unit: 'rem'}
 *   container.maxWidth.page    $value: '{layout.pageMaxWidth}'
 *
 * pass 1 transforms `layout.pageMaxWidth` in place to the string
 * `"56rem"`. `container.maxWidth.page` is deferred (it holds a
 * reference), then resolves in pass 2 — to the ALREADY-TRANSFORMED
 * `"56rem"`, not the original `{value, unit}` object. Because the
 * transform is transitive, it then runs on that string and a strict
 * parser rejects it.
 *
 * This is layer-independent: it happens for functional -> functional
 * aliases just as much as base -> functional, so excluding one token
 * layer (an earlier attempt here used a `filePath.includes("/tokens/base/")`
 * check) does not fix it. Dropping `transitive` is also wrong — verified
 * empirically: it silences the errors but emits `[object Object]` for
 * every aliased dimension, because the resolved-by-reference value then
 * never gets transformed at all.
 *
 * The correct fix, and the one this enables, is to make these transforms
 * idempotent: a second run over an already-formatted string returns it
 * unchanged. Primer's transforms lack this guard, but Primer's build sets
 * `log.verbosity: 'silent'` and `log.warnings: 'disabled'`, so the same
 * errors are raised and swallowed there rather than absent.
 *
 * Note that Style Dictionary does NOT fail the build on a transform
 * error — it logs it, substitutes the untransformed value, and exits 0
 * (see `_transformTokenWrapper`'s catch). A green exit code is therefore
 * not evidence of a clean build; the transform-error count is.
 */
export function isAlreadyTransformed(value: unknown): value is string {
  return typeof value === "string";
}
