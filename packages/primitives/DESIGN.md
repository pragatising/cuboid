# Token pipeline — design, research, and build order

Single source of truth for the token pipeline rebuild. Supersedes and replaces `docs/token-architecture-migration.md` and `docs/backlog/token-pipeline-implementation-strategy.md` — both deleted, their content merged here. Status: in progress.

---

## 1. Why this rebuild

Two motivations converged in the session that started this work:

- **A real bug** (`fontWeight` for `CodeBlock` silently resolving through a build script's private renaming instead of a real authored token) surfaced that cuboid's validation was 159 scattered `console.error`/`process.exit` checks inside the old `build-theme.mjs`, not a schema — a structural weakness, not a one-off.
- **A stated product goal**: automate building Figma components from code and vice versa, keeping design tokens as the live source of truth in both directions (§6).

Both point at the same root fix: a single, well-defined token pipeline that other tooling (schema validators, Figma sync agents, doc generators) can build on top of, instead of parsing bespoke JS.

**Decision:** replace the hand-rolled pipeline with a real Style Dictionary preset, following `primer/primitives`'s architecture where it earns its complexity and deliberately not where it doesn't — a clean rebuild, not a byte-diff-constrained migration (the original plan protected the then-current published output; that constraint was dropped once the scope of what needed fixing became clear).

---

## 2. Token format — DTCG shape, every leaf

**File format: `.json5`, not `.json`** — matches Primer's actual token source files. Same DTCG shape underneath (JSON5 is a strict superset of JSON's data model); the difference is authoring syntax: unquoted keys, trailing commas, and real inline comments (strict JSON has none). Style Dictionary parses `.json5` natively.

Every leaf token is `{ $value: <value>, $type: "<type>" }`. `$type` is required on every leaf (no inference from context) — this is what lets the build be one generic walker instead of per-component logic.

### The real `$type`s in use — verified against the W3C DTCG spec, not a snapshot of any one file

Full reference: `docs/knowledge/w3c-design-token.md`. The DTCG spec defines **13 standard types**:

| `$type` | `$value` shape |
|---|---|
| `color` | Color object (colorSpace, components, optional hex/alpha), or a bare hex string with `alpha` as a sibling key (cuboid's real authored shape) |
| `dimension` | `{ value: number, unit: "px" \| "rem" }` |
| `number` | Plain JSON number |
| `fontFamily` | String, or array of strings |
| `fontWeight` | Number (1–1000 in the spec; Primer constrains to `[100,200,...,900,950]`) |
| `duration` | `{ value: number, unit: "ms" \| "s" }` |
| `cubicBezier` | 4-number array `[P1x, P1y, P2x, P2y]` |
| `strokeStyle` | Predefined string, or `{ dashArray, lineCap }` |
| `border` | `{ color, width, style }` |
| `transition` | `{ duration, delay, timingFunction }` |
| `shadow` | One shadow object `{color, offsetX, offsetY, blur, spread}`, or an array of them (layered shadows) |
| `gradient` | Color stops + direction |
| `typography` | `{ fontFamily, fontSize, fontWeight, lineHeight }` bundle |

**Correction to an earlier draft of this doc:** an earlier version claimed cuboid's token set only needs 5 types (`color`, `dimension`, `number`, `fontFamily`, `shadow`), based on a one-time grep of the files that existed at the time. That framing was wrong twice over — the token files are still being authored/corrected during this rebuild, so grepping them is not the same as knowing the real spec; and a real check of `packages/react/src` found `fontWeight` already live and shipping (`Text.tsx` reads `tokens.typography.fontWeight`; `theme.css` already emits real `--cube-typography-text-*-fontWeight` properties). **All 13 standard types get real implementations** — no type is skipped by judgment call (see §7 for why).

A reference (`$value` is a `{path}` string, or a reference embedded inside a larger string like `"inset 0 0 0 {borderWidth.thin}"`) is valid on any type — Style Dictionary's own reference resolver handles both forms natively (see §3).

---

## 3. Build engine — Style Dictionary does resolution; the entry script only configures it

**This is the most important correction from the original plan.** Style Dictionary (installed, `v5.5.3`) resolves `{path}` references natively — recursively (multi-hop chains), embedded-reference-aware, with real circular-reference detection (a tracked stack, throws `"Circular definition cycle: a, b, c"` on a cycle). Verified directly against `node_modules/style-dictionary/lib/utils/references/resolveReferences.js` and against Primer's real `scripts/buildTokens.ts` — 300+ lines, containing **zero** hand-rolled resolution logic. It's entirely `StyleDictionary.extend({source, platforms}).buildAllPlatforms()` calls, configuration only.

This means:
- There is no "resolver to build." The entry script (`packages/primitives/scripts/build-tokens.mjs`) constructs a Style Dictionary config referencing registered transforms/formats/platforms, then calls `.buildAllPlatforms()` — the library does merge, resolve, transform, and emit internally.
- The old hand-rolled pipeline (`build-theme.mjs` + 3 sibling files, 2,527 lines) was **deleted outright**, not ported or kept for compatibility — every line of it reimplemented something Style Dictionary already does, and keeping it around only invites half-porting old logic instead of using the real engine. `package.json`'s `tokens:theme` now points at `scripts/build-tokens.mjs`.
- `transformers/utilities/getTokenValue.ts` is a narrow post-resolution helper (Primer's real, verified definition) — given an already-resolved `TransformedToken`, pull `$value` or one composite sub-property, throwing if missing. It is NOT a resolver.

### Registered pieces (transforms, formats, filters, preprocessors)

`packages/primitives/src/styleDictionary.ts` is the one exported `StyleDictionary` instance — every transform/format/preprocessor registers on it once, matching Primer's `primerStyleDictionary.ts` pattern exactly.

- **Transforms** — one per `$type` (e.g. `dimension/rem`, `color/hex`, `cubicBezier/css`) plus naming transforms per output convention (kebab-case for CSS vars, camelCase for JSON keys).
- **Filters** — predicates (`isColor`, `isSource`, etc.) that let a platform's file config decide which tokens go into which output file. `isSource` is the base filter Primer applies to every output.
- **Preprocessors** — run once over the whole tree before transforms. `themeOverrides` is the real dark-mode mechanism (§5).
- **Platforms** — one function per output target, composing transforms+formats+filters into a `PlatformConfig`.

---

## 4. What changes from the old output shape

- **No more `theme.json` vs. `token-output.json` split.** That split existed to separate "foundation" from "component" tokens for two different consumers inside the old `src/theme/*.ts` files. The new build emits one resolved tree; if a consumer needs a subset, it filters the flat token map by path prefix at import time, not at build time.
- **`zIndex` and other numeric-but-string values become real numbers.** `"700"` → `700` — a correctness fix, not a preserved quirk.
- **Shadows are structured DTCG shadow objects in the source**, joined to a CSS string only at CSS-emission time — the JSON export can hand a consumer the structured value if useful, not just a pre-joined string.
- **No 159 inline `console.error`/`process.exit` checks.** A Zod schema per `$type` validates every leaf uniformly.
- **CSS variable naming stays stable** (kebab-case, `--cube-` prefix) — consumers' `.module.css` files keep working unchanged, since naming is a function of the tree path, not of which script walks it.
- **The px-to-rem formula and its `SIZE_BASE_PX` override stay unchanged.**

## What an app using cuboid actually touches (the real consumption contract — do not break)

Verified against portfolio's real usage (~60 import sites):

- **CSS seam:** `import '@sragatiping/cuboid/{style,theme,components,icon-fonts}.css'` once at the app root — every cuboid component's own `.module.css` reads `var(--cube-*)` from global scope. The new pipeline must keep emitting these same export paths with the same variable names.
- **JS seam:** `ThemeProvider`, `defaultTheme`, `tokenOutput` imported directly in several files, with `ThemeProvider`'s partial-deep-merge override behavior actively used. This is Context-based, per-subtree runtime override — Primer's architecture has no equivalent (Primer only flips a `data-color-mode` attribute). Adopting Primer's build pipeline must NOT mean dropping this JS seam.
- **App-authored full themes (decided this session):** an app should be able to author its OWN complete theme (own palette, own spacing) — not just override one CSS variable or pass a JS object into `ThemeProvider`. This needs cuboid's Style Dictionary preset exposed as a real consumable API (package export or CLI — not yet decided), so an app compiles its own `.json5` token file through the same pipeline cuboid uses internally and gets back real `--cube-*` CSS plus a JSON output in the identical shape cuboid's own `defaultTheme.ts` uses. **One shared JSON format function**, not two separate code paths — an app's compiled theme and cuboid's own theme must resolve identically, or they can silently drift.
- **App-added component variants (decided this session):** an app should be able to add a new variant (e.g. `button.accent`) by authoring a token file, compiling it, and loading the resulting CSS after cuboid's own stylesheet — with zero cuboid release, zero fork. This requires components to resolve variant styling via constructed CSS variable name (`var(--cube-button-${variant}-bg-rest)`), not by indexing a closed TypeScript union into a compiled JS object — a rebuild requirement for every variant-driven component (Button, Pill, IconButton, etc.), not a token-pipeline concern alone.
- **`defaultTheme.ts`'s internal wiring** should move to generic path-based access (`getByPath(tokens, "button.primary.bgColor.rest")`) rather than named destructuring of specific top-level keys — this removes the coupling where any structural change to primitives' output breaks react's consumption (the literal cause of the build being broken going into this rebuild). Tradeoff: a typo'd path string is a runtime error, not a compile error, unless a future pass adds generated path-union types.

---

## 5. Dark mode / theme variants (not yet built, real mechanism decided)

**Primer's real pattern, directly transferable:** no parallel diff-file trees per theme. Every token carries all its variants inline, under one `$extensions['org.cuboid.overrides']` object:

```json5
danger: {
  $value: '#d1242f',
  $type: 'color',
  $extensions: {
    'org.cuboid.overrides': {
      dark: '{base.color.red.4}',
      'dark-high-contrast': '{base.color.red.3}',
    },
  },
}
```

A `themeOverrides` preprocessor collapses this to one resolved value per theme at build time, with fallback. Base color *scales* (not functional tokens) are the one exception — those live in genuinely separate files merged via Style Dictionary's `include`, since a whole-scale swap is what a base palette needs, not a per-token override.

Scope: **light/dark only** to start, not Primer's full high-contrast/colorblind matrix — the inline-override mechanism scales to any number of theme keys later with zero migration cost.

---

## 6. Bidirectional Figma sync — a genuinely new capability, not in Primer

Not part of the current build-order work (§7), but the reason the pipeline needs to be real before this can start.

### 6.1 What's actually possible — verified against the real Figma tool surface

| Direction | Tool(s) | What it actually does |
|---|---|---|
| Figma → code (design exists, no component) | `get_design_context` | Mature, already-used path (`figma-design-to-code` skill). Returns reference code + screenshot + metadata. |
| Code → Figma (component exists, no design) | `use_figma` | Real node-construction capability — executes JS against Figma's Plugin API: frames, auto-layout, components, component properties, and **variables** (`figma.variables.*`). |
| New file creation | `create_new_file` | Creates a blank file to build into via `use_figma`. |
| Variable read | `search_design_system` (`entity: "variable"`) | Queries existing published variables/components/styles. |
| Variable write | `use_figma` (`figma.variables.createVariable`/`setValueForMode`) | No dedicated tool — done via `use_figma`'s JS execution, same mechanism as node creation. |
| Link existing Figma node ↔ existing code | `add_code_connect_map`, `get_code_connect_suggestions`, `send_code_connect_mappings`, `list_file_components_for_code_connect` | Figma's own "Code Connect" system, including bulk dependency-ordered planning for a whole library. |
| Assets | `upload_assets` | SVGs import as editable vector trees; raster images bind to fills. |

**What doesn't exist:** no single "component.tsx → Figma component" one-shot tool. Building one means an agent that reads props/variants from code + stories, maps each to a Figma component property and each token to a variable binding, emits `use_figma` JS to construct the layer tree, then calls Code Connect to link it. A real, buildable, multi-step agent workflow — scope as its own project once the token pipeline (this doc) ships.

### 6.2 Why this depends on the pipeline shipping first

A Figma variable created today would hardcode a value pulled from wherever tokens currently live. Once the pipeline is real, the same preset that emits CSS/JSON can emit a `jsonFigma`-shaped output (Primer's own format, directly reusable — flat array of Figma Variable API objects), and the sync agent binds Figma variables to *that*, never a second hand-maintained copy.

### 6.3 Sync target — one shared cuboid library file, not per-project files

Cuboid already works as one source, many consumers (the npm package model). Figma sync mirrors that: **one Figma file is the canonical cuboid design-system file** — every token as a variable, every component. Any other Figma file imports it as a library, the same way app code imports `@sragatiping/cuboid`. The sync agent only ever writes to one file — no fan-out, no per-project drift to reconcile.

### 6.4 Proposed first-version scope (not yet phase-planned)

1. Variable sync both directions — push the `jsonFigma` output into the shared library file via `use_figma`; pull Figma variable edits back into `src/tokens/` via the existing DTCG-import pattern (`flatten-functional-colors.mjs` already does this shape of conversion).
2. Code → Figma component generation, gated on (1) existing.
3. Figma → code stays on the existing `figma-design-to-code` path.
4. Code Connect linking as the closing step, using the existing bulk-planning tools.

---

## 7. Build order

**Scope: every scaffolded file in `packages/primitives/src/` gets a real implementation.** No file is skipped by judgment call — an earlier draft of this plan proposed deferring ~120 of ~150 files by "no current need," and that judgment included at least one confirmed error (`fontWeight`, see §2's correction). Everything gets built, in the dependency order below. Each file's real content matches Primer's verified role for that file, adapted to cuboid's own namespace (`org.cuboid.*`, not `org.primer.*`) and its own type list (dropping Primer's org-specific `custom-string`/`custom-viewportRange` additions unless cuboid has a real equivalent need).

### Done
1. `utilities/treeWalker.ts` — generic recursive tree walker (matches Primer exactly: visits every node matching a predicate, does not recurse into a matched node's own children).
2. `utilities/log.ts` — logger wired to Style Dictionary's `PlatformConfig.log` verbosity.
3. `schemas/baseToken.ts`, `referenceValue.ts`, `tokenType.ts`, `validTokenType.ts`, `tokenName.ts` — shared schema foundation.
4. `transformers/nameToKebabCase.ts` — CSS variable naming (pre-existing).
5. Deleted: `build-theme.mjs` + 3 sibling files (2,527 lines) — see §3.

### Remaining, in order

6. **Generic utilities** — `toCamelCase`, `toPascalCase`, `lowerCaseFirstCharacter`, `upperCaseFirstCharacter`, `asArray`, `joinFriendly`, `filterStringArray`, `getFlag`, `schemaErrorMessage`, `copyFromDir`. Small, self-contained — schemas/transformers import these throughout.
7. **Shared schema building blocks** — `schemas/alphaValue.ts`, `collections.ts`, `scopes.ts`, `llmExtension.ts` (alpha-channel validation, Figma collection/scope enums, the `org.cuboid.llm` extension shape).
8. **Color** — `schemas/colorHexValue.ts`, `colorW3cValue.ts`, `colorToken.ts`; `transformers/colorToHex.ts`, `colorToRgbAlpha.ts`, `colorToRgbaFloat.ts`; `transformers/utilities/hexToRgbaFloat.ts`, `rgbaFloatToHex.ts`, `isRgbaFloat.ts`, `normalizeColorValue.ts`, `alpha.ts`; `filters/isColor.ts`, `isColorWithAlpha.ts`; `types/colorTokenValue.d.ts`, `colorHex.d.ts`. Highest usage; `shadow`/`border`/`gradient` depend on it.
9. **Dimension** — `schemas/dimensionValue.ts`, `dimensionToken.ts`; `transformers/dimensionToRem.ts`, `dimensionToPixelUnitless.ts`, `dimensionToRemPxArray.ts`, `floatToPixel.ts`; `transformers/utilities/parseDimension.ts`; `filters/isDimension.ts`; `types/dimensionTokenValue.d.ts`, `sizeEm.d.ts`, `sizePx.d.ts`, `sizeRem.d.ts`. `shadow`/`border`/`typography` depend on it.
10. **Number, fontFamily, fontWeight** (simple/near-passthrough, together) — `schemas/numberToken.ts`, `fontFamilyToken.ts`, `fontWeightToken.ts`, `fontWeightValue.ts`; `transformers/fontFamilyToCss.ts`, `fontFamilyToFigma.ts`, `fontWeightToNumber.ts`; `filters/isNumber.ts`, `isFontFamily.ts`, `isFontWeight.ts`; `types/typographyTokenValue.d.ts`.
11. **CubicBezier, duration** (same source file, same effort) — `schemas/cubicBezierToken.ts`, `durationValue.ts`, `durationToken.ts`; `transformers/cubicBezierToCss.ts`, `durationToCss.ts`; `filters/isCubicBezier.ts`, `isDuration.ts`.
12. **Shadow** (needs color + dimension) — `schemas/shadowToken.ts`; `transformers/shadowToCss.ts`; `filters/isShadow.ts`; `types/shadowTokenValue.d.ts`, `shadow.d.ts`.
13. **Border** (needs color + dimension) — `schemas/borderToken.ts`; `transformers/borderToCss.ts`; `filters/isBorder.ts`; `types/border.d.ts`, `borderTokenValue.d.ts`.
14. **Transition** (needs duration + cubicBezier) — `schemas/transitionToken.ts`; `transformers/transitionToCss.ts`; `filters/isTransition.ts`.
15. **Typography** (needs dimension + fontWeight + fontFamily) — `schemas/typographyToken.ts`; `transformers/typographyToCss.ts`; `filters/isTypography.ts`.
16. **Gradient** (needs color) — `schemas/gradientToken.ts`; `transformers/gradientToCss.ts`; `filters/isGradient.ts`.
17. **`schemas/viewportRangeToken.ts`, `stringToken.ts`** — confirm cuboid's real equivalent need before assuming Primer's exact shape applies.
18. **`schemas/designToken.ts`** — the discriminated union tying every per-type schema together; built last since it imports all of them.
19. **Remaining filters** — `isFromFile.ts`, `isDeprecated.ts`, `isSource.ts`, `hasLlmExtensions.ts`. `isSource` is Primer's base filter on every output.
20. **Remaining `.d.ts` types** — `designToken.d.ts`, `embeddedReferenceValue.d.ts`, `tokenType.d.ts`, `platformInitializer.d.ts`, `styleDictionaryConfigGenerator.d.ts`, `tokenBuildInput.d.ts`, `w3cTransformedToken.d.ts`.
21. **Remaining transformer support utilities** — `transformers/utilities/checkRequiredTokenProperties.ts`, `getTokenValues.ts`, `invalidTokenError.ts`, `hasSpaceInStrings.ts`, `figmaAttributes.ts`, `jsonDeprecated.ts`.
22. **Remaining naming transforms** — `namePathToCamelCase.ts`, `namePathToDotNotation.ts`, `namePathToFigma.ts`, `namePathToPascalCase.ts`, `namePathToSlashNotation.ts` — one per output format's key convention.
23. **`formats/cssAdvanced.ts`** — first real output format. Verify against one real token file before wiring the full tree.
24. **`formats/jsonNestedPrefixed.ts`** — the shared JSON format both cuboid's own build and Task 4.5's app-facing theme compilation reuse (nested, per §2/§4 — not flattened). **Corrected 2026-09-23:** an earlier draft of this doc named `jsonOneDimensional.ts` as the shared format; that was backwards relative to Primer's real naming — `jsonOneDimensional` is explicitly the FLAT format (its own logic calls `jsonToFlat`), while `jsonNestedPrefixed` is the real nested one. Both are now built; `jsonNestedPrefixed.ts` is the one actually wired to `defaultTheme.ts`'s needs.
25. **Remaining output formats** — `cssCustomMedia.ts`, `javascriptCommonJs.ts`, `javascriptEsm.ts`, `jsonFigma.ts`, `jsonPostCssFallback.ts`, `markdownLlmGuidelines.ts`, `typescriptExportDefinition.ts`.
26. **`formats/utilities/`** — `getPropName.ts`, `jsonToFlat.ts`, `jsonToNestedValue.ts`, `prefixTokens.ts`.
27. **`preprocessors/inheritGroupProperties.ts`** — propagates shared `$type`/`$extensions` to children that don't repeat it.
28. **`preprocessors/themeOverrides.ts` + `preprocessors/utilities/transformTokens.ts`** — the real dark-mode mechanism (§5).
29. **`platforms/`** — `css.ts`, `json.ts`, `javascript.ts`, `typescript.ts`, `figma.ts`, `fallbacks.ts`, `styleLint.ts`, `docJson.ts`, `deprecatedJson.ts`, `llmGuidelines.ts`, `typeDefinitions.ts` — one function per output target.
30. **The entry-point script** (`packages/primitives/scripts/build-tokens.mjs`) — configuration only (§3): `StyleDictionary.extend({source, platforms}).buildAllPlatforms()` using the platforms from step 29.
31. **Confirm `package.json`'s `tokens:theme`** runs once the script exists (already pointed at it).
32. **`test-utilities/`** — `getMockToken.ts`, `getMockDictionary.ts`, `getMockFormatterArguments.ts`, `getMockParserInput.ts` — built alongside the first real test suite that needs them.
33. **`npm run build`** — the finish line. Iterate against real errors until clean.

### Notes that stay true throughout
- `baseToken` deliberately excludes `$extensions` (matches Primer) — each per-type schema declares its own `$extensions` shape, since valid Figma scopes differ per type.
- Rewriting `packages/react/src/theme/*.ts` against the new output (§4's consumption contract) happens once step 33 is green — a separate, necessary pass, not implied by the build succeeding.
