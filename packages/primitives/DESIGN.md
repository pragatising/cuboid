# Token pipeline — design (rebuilt from scratch)

Status: in progress, this branch. Supersedes the byte-diff-constrained Phase 1 plan in `docs/token-architecture-migration.md` — that plan assumed protecting the current published consumer; this branch is a clean rebuild with no such constraint (see CHANGELOG for the decision).

## 1. Token format — DTCG shape, every leaf

**File format: `.json5`, not `.json`** — matches Primer's actual token source files. Same DTCG shape underneath (JSON5 is a strict superset of JSON's data model); the only difference is authoring syntax: unquoted keys, trailing commas allowed, and — the real reason this matters for a single hand-authoring maintainer — real inline comments, which strict JSON has no support for at all. Style Dictionary parses `.json5` natively. The one tradeoff: TypeScript's `resolveJsonModule` only resolves `.json`, so nothing can `import` a token file directly as a JS module — not a capability cuboid uses today, so this costs nothing in practice.

Every leaf token is exactly:

```json5
{ $value: <value>, $type: "<type>" }
```

`$type` is required on every leaf (no inference from context) because it's what lets the build be a single generic walker instead of per-component logic — this is the actual lesson from reading Primer's real `.json5` source, not an aesthetic preference for DTCG.

### The five `$type`s this token set actually needs (verified against all 45 current files)

| `$type` | Shape of `$value` | Real example found |
|---|---|---|
| `color` | hex string, or `{path}` reference | `"#FFFFFF"`, `"{base.color.scale.gray.11}"` |
| `dimension` | `"<number>px"` or `"<number>rem"` string | `"8px"` |
| `number` | a real JSON number (never a numeric string) | `16` (line-height), `700` (z-index — **changing from today's `"700"` string, a deliberate fix**) |
| `fontFamily` | string or array of strings | `"Inter"`, the system font stack |
| `shadow` | one shadow object `{color, offsetX, offsetY, blur, spread}`, or an array of them for layered shadows — DTCG's real composite shape, not a pre-joined CSS string | today's `"0 0 0 1px rgba(...), 0 20px..."` becomes a 3-element array |

A reference (`$value` is a `{path}` string) is valid on any type — the resolver follows it before the type-specific transform ever runs.

### What each token file looks like now (button primary, rewritten)

```json
{
  "color": {
    "button": {
      "primary": {
        "bgColor": {
          "rest": { "$value": "{base.color.scale.gray.11}", "$type": "color" },
          "hover": { "$value": "{base.color.scale.gray.12}", "$type": "color" }
        }
      }
    }
  }
}
```

Structurally identical nesting to today — only the leaf shape changes (`value` → `$value` + `$type`).

## 2. Build — one generic walker, zero per-component code

The replacement for `build-theme.mjs`'s ~1300-line `main()`:

1. **Merge** every file under `tokens/` into one tree (same recursive merge Cuboid already does — this part was never the problem).
2. **Resolve references** — walk the tree, replace every `{path}` `$value` with the resolved target's `$value`, repeat until no references remain (same fixed-point loop `build-theme.mjs` already uses — also not the problem).
3. **Transform by `$type`**, generically, no path-based branching:
   - `dimension` → px-to-rem (existing formula, `SIZE_BASE_PX` env-configurable)
   - `color` → passed through (already resolved to a hex/rgba string)
   - `number` → passed through as-is
   - `fontFamily` → passed through as-is
   - `shadow` → joined into one CSS shorthand string (or comma-joined if an array)
4. **Emit**, walking the whole resolved tree once: for every leaf, one CSS custom property (`--cube-<kebab-path>`) and one entry in the JS/TS token export. No picking specific components, no two differently-shaped output documents — **one flat token tree, one CSS file, one JSON file, one typed JS module**, each a straightforward projection of the same resolved tree.

This is what makes the rewrite smaller than porting `build-theme.mjs`'s logic: steps 1–2 are unchanged and already correct; step 3 is 5 small, generic, testable functions instead of ~20 per-component blocks; step 4 is one recursive emitter instead of hand-picking `componentColorKeys`/`componentSizeKeys`/`foundationSizeKeys`.

## 3. What this deliberately drops from today's output shape

- **No more `theme.json` vs. `token-output.json` split.** That split existed to separate "foundation" from "component" tokens for two different consumers inside the old `src/theme/*.ts` files. The new build emits one resolved tree; if a consumer needs a subset, it filters the flat token map by path prefix at import time, not at build time. Simpler build, same capability.
- **`zIndex` and other numeric-but-string values become real numbers.** `"700"` → `700`. This is a correctness fix, not preserved as a quirk.
- **Shadows become structured DTCG shadow objects in the source**, joined to a CSS string only at the CSS-emission step — the JSON/JS export can hand a consumer the structured value (color, offsets, blur) if that's ever useful, not just a pre-joined string.
- **No 159 inline `console.error`/`process.exit` checks.** A Zod schema per `$type` validates every leaf uniformly; a malformed token fails validation with a path and reason, not a hand-written message some components have and others don't.

## 4. What doesn't change

- Folder layout: `tokens/base/`, `tokens/functional/{colors,components,size,shadows,typography}/` — the categorization is fine, only the leaf shape inside each file changes.
- The `{path}` reference syntax.
- The px-to-rem formula and its `SIZE_BASE_PX` override.
- CSS variable naming convention (kebab-case, `--cube-` prefix) — consumers' `.module.css` files keep working unchanged as long as the same paths produce the same var names, which they will (naming is a function of the tree path, not of which script walks it).

## 5. Work plan

1. Write the five `$type` transform functions + the generic tree walker (`src/style-dictionary/` already scaffolded in Phase 0 — extend it, don't replace it).
2. Write a Zod schema per `$type` (extends Phase 0's `tokenLeaf.mjs`, which validated the *old* shape — supersede it here).
3. Re-author all 45 token files to the new leaf shape. Mechanical, one category at a time, each independently verifiable by loading it through the new walker.
4. Rewrite `src/theme/*.ts` (`foundationTokens.ts`, `defaultTheme.ts`, etc.) against the new flat output shape — this is real, necessary work since those files currently destructure the old `theme.json`/`token-output.json` split.
5. Wire components' `.module.css` — expected to need zero changes, since var names are stable by design; verify by building Storybook and eyeballing a few components, not a byte-diff.
