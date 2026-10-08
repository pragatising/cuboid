# Primitives pipeline tracker

Source of truth for which `packages/primitives/src/*` pipeline files are real vs. still a stub. Companion to `token-migration-tracker.md` (which tracks token *content* correctness per component) — this tracks the pipeline *code* that reads/validates/transforms/emits that content, a separate axis. Build order and full design context live in `packages/primitives/DESIGN.md` §7 — this file is the scannable status table that doc doesn't have.

**Status values:** `Done` (real logic, typechecked) → `Not started` (stub only, throws "not implemented").

Update the status column as files are implemented. Don't delete rows — this is the permanent record of the rebuild.

---

## STATUS — 2026-09-25: pipeline is GREEN, both outputs emitting

All 145 files implemented, and `npm run tokens:theme` now exits 0 with **0 transform errors**, emitting both
`packages/react/src/theme/output/theme.css` (783 vars) and `tokens.json`. `npm test` = no-react guard +
typecheck + 53 tests, all passing. Committed.

Entry point is **`scripts/buildTokens.ts`** (renamed from `build-tokens.mjs`: matches Primer, and is now
typechecked via `tsconfig.typecheck.json` — the emit config's `rootDir: "src"` can't include `scripts/`).

### The one thing to understand about this pipeline

**Style Dictionary does not fail on transform errors.** It logs them, substitutes the untransformed value,
and exits 0. A green build is therefore NOT evidence of correct output. Two separate real bugs hid behind
`exit 0` this session: 224 transform errors, and every shadow emitting `undefinedundefined` for its offsets.
Both were found by reading emitted values, not by trusting the exit code.

`buildTokens.ts` now sets `log.warnings: "error"` + `errors.brokenReferences: "throw"` so the build is a real
gate. Two expected warnings are downgraded per-platform, each with an in-file rationale (multi-layer shadow
refs in css; name collisions the nested JSON format never reads in json). **If you add output, re-check that
the gate still fires** — verify by reading values, not the exit code.

### Root cause, corrected from the earlier (wrong) diagnosis

The earlier handoff claimed the double-transform bug was base-layer-specific. It is not. Style Dictionary
resolves references and transforms values in the **same repeated pass** over one shared token map
(`lib/transform/map.js`, `lib/transform/token.js`, `StyleDictionary.js`'s `_exportPlatform` while-loop), so
any token resolving FROM an already-transformed token inherits the transformed value. Proven on a
functional→functional alias with no base token involved:

```
layout.pageMaxWidth      $value: {value: 56, unit: 'rem'}   (functional/)
container.maxWidth.page  $value: '{layout.pageMaxWidth}'    (components/)  -> receives "56rem"
```

**Fix: the transitive transforms are idempotent** — `transformers/utilities/isAlreadyTransformed.ts`, applied
in `dimensionToRem`, `dimensionToPixelUnitless`, `dimensionToRemPxArray`, `durationToCss`, `cubicBezierToCss`,
`typographyToCss`. `src/transformers/idempotence.test.ts` covers it (9 tests, verified to fail 9/9 without
the guard).

Two alternatives were **tested and rejected**, not merely reasoned about:
- Dropping `transitive: true` — cleared the 208 errors but emitted `[object Object]` for every aliased
  dimension, because a reference-resolved value then never gets transformed at all.
- A base-layer filter (`isBaseToken.ts`, since deleted) — leaves functional→functional aliases broken.

Design point worth keeping: Primer filters transforms by **type** only (`isDimension`, `isCubicBezier`).
Token layer is an **output** concern (which file a token lands in), never a transform concern.

### Real remaining work — token CONTENT, not pipeline

1. **RESOLVED (2026-10-07).** The `.json`-vs-`.json5` glob gap this item originally described no longer
   exists — every component token file was converted to `.json5`, DTCG format, confirmed by re-running
   `token-migration-tracker.md`'s Appendix A classification command (`old=0`, `dtcg>0`, `stale=0` on all
   41 files). See that tracker for the current per-component record.
2. **DONE (2026-10-07).** All 27 Zod schemas are now wired in via a standalone validator,
   `scripts/validateTokens.ts` (`npm run validate:tokens`) — walks every `src/tokens/**/*.json5` file,
   `safeParse`s it against `designToken` (the real discriminated-union schema, previously dead code), and
   reports every failure with its exact path before exiting 1. Deliberately decoupled from
   `buildTokens.ts`/`npm test` (matches Primer's real, verified pattern: validation and building are two
   separate pipelines reading the same source files, not one hooked into the other's lifecycle) — run it
   explicitly, or fold it into CI once CI exists. First real run caught 3 genuine content bugs, now fixed:
   `sheet.sizes.maxHeight` and `sidebar.sizes.widthMinimized` were bare strings where their `$type`
   required a structured value (one became `custom-string`, the other a real `{value, unit}` object); and
   `tokenName`'s schema was too strict — widened to allow the real, intentional decimal-fraction naming
   used by `base.color.shadowAlpha.*` (e.g. `black["0.05"]`).
3. **Also done (2026-10-07):** `javascript`/`typescript` platforms wired into `buildTokens.ts` alongside
   `css`/`json` — `dist/js/tokens.js` (ESM) and `dist/cjs/tokens.js` (CommonJS), both fully resolved
   values, verified leaf-count-identical to `tokens.json`. The real consumer seam for ADR-04
   (`docs/adr/adr-04-token-consumption-shape.md`) — components read resolved values from a static import,
   never CSS vars or React context. `applyOverrides()` (`src/applyOverrides.ts`) is the runtime
   re-theming mechanism: a plain recursive merge, called once by the consuming app, no dependency on this
   package's build tooling.
4. **RESOLVED (2026-10-07): `z-index` scale gap.** `base.zIndex` extended with `700`/`800`/`900` steps;
   `functional/size/z-index.json5`'s `popover`/`tooltip`/`toast` now alias those real base steps instead
   of hardcoding literals, GAP markers removed. Ordering verified against real precedent (Chakra UI,
   Material UI, Bootstrap, Ant Design, Primer's own scale), not guessed: `popover(700) < tooltip(800) <
   toast(900)` — tooltip must outrank popover (a tooltip commonly nests inside an open popover/menu, and
   must render above it; unanimous across every library checked), and toast outranks tooltip as the
   highest named layer below `max` (a toast is a global app-level notification that must never be hidden
   by anything else, including a tooltip — matches Bootstrap/Ant Design's "notification above all"
   pattern over Chakra/MUI's "tooltip above all" alternative, since cuboid's goal is toasts never being
   obscured). The existing 100-step increment and `overlay(400) < sheet(500) < dialog(600)` ordering were
   both independently confirmed correct against the same precedent — no change needed there.
5. **~18 remaining `$description: 'GAP: ...'` markers** are deliberate self-flags, lower urgency: several
   `functional/colors/syntax.json5` and `highlight/color.json5` hues with no matching base color step
   (kept as literals pending a base-palette addition), and `button`/`icon-button` disabled-state borders
   falling back to `borderColor.subtle` (visible UI impact — disabled currently renders identical to
   rest/hover instead of fainter).
4. Shadow values are structurally correct but their **composited alphas were never cross-checked against
   Figma** — worth verifying if shadows are design-critical.

### Next planned step

`platforms/typescript.ts` + `typeDefinitions.ts` are implemented but **unwired**. `tokens.json` already gives
importable *values*; these add the *types* that make token-valued component props autocomplete and fail at
compile time on a typo. Expect some real work, not a pure two-line wire-up: `typeDefinitions` references
`tokenTypesPath: "./src/types/"`, a Primer-shaped path that may not resolve here.

### Deliberately NOT touched

`packages/react` stays broken until the rebuild reaches it (explicit user decision). `defaultTheme.ts` still
imports `output/theme.json`, `base.json`, `tokenOutput.ts` — **Sep 12 files that nothing can regenerate**,
since the scripts that produced them were deleted. Do not untrack or delete them; they are the only copy.

---

## Group 1 — Generic utilities (no token-domain knowledge)

What they do: string/array helpers every schema and transformer imports. No dependencies on anything else in the pipeline.

| File | Status | What it does |
|---|---|---|
| `utilities/treeWalker.ts` | **Done** | Recursively walks a token tree, running a callback on every node matching a predicate; does not recurse into a matched node's own children. |
| `utilities/log.ts` | **Done** | Consistent build-time logging, wired to Style Dictionary's `PlatformConfig.log` verbosity settings. |
| `utilities/toCamelCase.ts` | **Done** | kebab-case/space-separated string → camelCase. Needed for JSON output key naming. |
| `utilities/toPascalCase.ts` | **Done** | String → PascalCase. Used by generated-type-name formatting. |
| `utilities/lowerCaseFirstCharacter.ts` | **Done** | Lowercases just the first character of a string. |
| `utilities/upperCaseFirstCharacter.ts` | **Done** | Uppercases just the first character of a string. |
| `utilities/asArray.ts` | **Done** | Wraps a single value or array into an array uniformly (e.g. theme options that accept one or many). |
| `utilities/joinFriendly.ts` | **Done** | Joins a string array into a human-readable list ("a, b, or c") — used in schema error messages. |
| `utilities/filterStringArray.ts` | **Done** | Filters an array down to unique/valid string entries. |
| `utilities/getFlag.ts` | **Done** | Reads a CLI/env flag with a default fallback. |
| `utilities/schemaErrorMessage.ts` | **Done** | Formats a two-part (what's wrong / what's expected) Zod error message consistently across all schemas. |
| `utilities/copyFromDir.ts` | **Done** | Recursively copies files from one directory to another — used by build scripts that stage output. Fixed a real bug from Primer's version (missing `await` on each copy). |

## Group 2 — Schema foundation

What they do: the shared shape every per-type schema (color, dimension, etc.) extends or composes. Build before any real type schema.

| File | Status | What it does |
|---|---|---|
| `schemas/baseToken.ts` | **Done** | `{$description}` — the shape every per-type schema extends. Deliberately excludes `$extensions` (each type declares its own). |
| `schemas/referenceValue.ts` | **Done** | Validates a whole-value `{path.to.token}` reference string. |
| `schemas/tokenType.ts` | **Done** | Returns a Zod literal for one specific `$type` value (e.g. `tokenType("color")`). |
| `schemas/validTokenType.ts` | **Done** | The 13 real DTCG type names cuboid validates against, plus an `isValidTokenType` guard. |
| `schemas/tokenName.ts` | **Done** | Validates a single token path segment (kebab-case or camelCase, starts lowercase). |
| `schemas/alphaValue.ts` | **Done** | Validates a number between 0 and 1 — the alpha channel on a color token. |
| `schemas/collections.ts` | **Done** | Validates a token's declared Figma "collection" name against an allowed list (per-type), plus a `mode()` validator (same shape) for theme-mode names — real infrastructure for the dark-mode mechanism (DESIGN.md §5), built ahead of any mode data existing. Generic validators only — cuboid's real collection/mode names not yet decided, each caller passes its own list. |
| `schemas/scopes.ts` | **Done** | Validates a token's declared Figma "scopes" array against an allowed list (per-type). Same generic-validator note as collections.ts. |
| `schemas/llmExtension.ts` | **Done** | Validates the shape of the `org.cuboid.llm` extension object (`usage`, `rules`). |

## Group 3 — Color (highest usage; shadow/border/gradient depend on it)

| File | Status | What it does |
|---|---|---|
| `schemas/colorHexValue.ts` | **Done** | Validates a 3/6/8-digit hex color string. |
| `schemas/colorW3cValue.ts` | **Done** | Validates the full W3C color object shape (colorSpace, components, alpha, hex). |
| `schemas/colorToken.ts` | **Done** | Full `color` token schema: `$value` (hex, W3C object, or reference) + `$type` + real `alpha` sibling key + loosely-typed `$extensions`. |
| `transformers/colorToHex.ts` | **Done** | Real Style Dictionary `Transform` object — converts a resolved color token's value to hex, applying its `alpha` sibling key. |
| `transformers/colorToRgbAlpha.ts` | **Done** | Real `Transform` — converts a color-with-alpha token to an `rgba()` CSS string. |
| `transformers/colorToRgbaFloat.ts` | **Done** | Real `Transform` — converts a color to float-based RGBA components (0–1 range). |
| `transformers/utilities/hexToRgbaFloat.ts` | **Done** | Hex string → float RGBA components. |
| `transformers/utilities/rgbaFloatToHex.ts` | **Done** | Float RGBA components → hex string. Fixed a precision bug from Primer's version (truncation instead of rounding). |
| `transformers/utilities/isRgbaFloat.ts` | **Done** | Type guard: is this value already float-RGBA shaped? Also exports the shared `RgbaFloat` type. |
| `transformers/utilities/normalizeColorValue.ts` | **Done** | Normalizes any accepted color shape (string or W3C object, any color space) to CSS-ready hex via `colorjs.io` (new real dependency, user-approved). Also exports `isW3cColorValue`. |
| `transformers/utilities/alpha.ts` | **Done** | Applies a desired alpha to a color string via `color2k` (new real dependency, user-approved), warning if the source color already had its own alpha. |
| `filters/isColor.ts` | **Done** | `token.$type === "color"` — lets a platform's file config select color tokens. |
| `filters/isColorWithAlpha.ts` | **Done** | `isColor(token) && token has alpha` — selects only colors with a real alpha channel. |
| `types/colorTokenValue.d.ts` | **Done** | TS type for a resolved color token's value shape — corrected from an earlier stub that wrongly assumed hex-only. |
| `types/colorHex.d.ts` | **Done** | TS type for a hex color string. |

**Pulled forward from later groups (color genuinely depended on them):** `transformers/namePathToDotNotation.ts` (Group 16), `transformers/utilities/invalidTokenError.ts` + `getTokenValues.ts` (Group 15) — all real, all done. `getTokenValues.ts` is NOT a reference resolver (Style Dictionary resolves references natively, see DESIGN.md §3) — it's Primer's real, narrow "pull $value or one composite sub-property from an already-resolved token" helper.

## Group 4 — Dimension (second-highest usage; shadow/border/typography depend on it)

| File | Status | What it does |
|---|---|---|
| `schemas/dimensionValue.ts` | **Done** | Validates `{value: number, unit: "px"\|"rem"\|"em"}` — corrected to 3 units, not 2 (Primer's real spec includes "em", not in DTCG proper but supported for practical use). |
| `schemas/dimensionToken.ts` | **Done** | Full `dimension` token schema. |
| `transformers/dimensionToRem.ts` | **Done** | Real Style Dictionary `Transform` object — converts a `{value, unit}` dimension to rem, honoring `basePxFontSize`; rem/em pass through unchanged. Replaces the wrong first-session stub (only handled a bare px string). |
| `transformers/dimensionToPixelUnitless.ts` | **Done** | Real `Transform` — converts a dimension to a bare px number. |
| `transformers/dimensionToRemPxArray.ts` | **Done** | Real `Transform` — converts a dimension to a `[rem, px]` pair. |
| `transformers/floatToPixel.ts` | **Done** | Real `Transform`s (`floatToPixel`/`floatToPixelUnitless`) — converts a number token to px using an `org.cuboid.data.fontSize` extension multiplier (renamed from Primer's `org.primer.data`); passes through unchanged if that extension isn't present. |
| `transformers/utilities/parseDimension.ts` | **Done** | Parses/validates a `{value, unit}` dimension object, shared by the transforms above. |
| `filters/isDimension.ts` | **Done** | `token.$type === "dimension"`. |
| `types/dimensionTokenValue.d.ts` | **Done** | TS type for a resolved dimension token's value shape (3 units). |
| `types/sizeEm.d.ts` | **Done** | TS type for an em-unit CSS string. |
| `types/sizePx.d.ts` | **Done** | TS type for a px-unit CSS string. |
| `types/sizeRem.d.ts` | **Done** | TS type for a rem-unit CSS string. |

**Pulled forward from Group 5:** `filters/isNumber.ts` — `floatToPixel.ts` genuinely depends on it.

**Real fix this group, not new scope:** `styleDictionary.ts` and `transformers/nameToKebabCase.ts` were written in the very first session against a wrong assumption (bare functions, not real Style Dictionary `Transform` objects). Once real `dimensionToRem` existed as a `Transform`, `styleDictionary.ts` broke — rewrote both to match Primer's real pattern (`registerTransform(transform)` directly; `nameToKebabCase`'s `--cube-` prefix now comes from Style Dictionary's own `prefix` platform option, not hardcoded).

## Group 5 — Number, fontFamily, fontWeight (simple/near-passthrough)

| File | Status | What it does |
|---|---|---|
| `schemas/numberToken.ts` | **Done** | Full `number` token schema — plain JSON number or reference. |
| `schemas/fontFamilyToken.ts` | **Done** | Full `fontFamily` token schema — string, array of strings, or reference (widened from Primer's string-only, matching what the transformer already supports). |
| `schemas/fontWeightToken.ts` | **Done** | Full `fontWeight` token schema. |
| `schemas/fontWeightValue.ts` | **Done** | Validates a font weight number against the allowed set (100–900, 950). |
| `transformers/fontFamilyToCss.ts` | **Done** | Real `Transform` — font stack string/array → CSS-ready `font-family` value, quoting names with spaces. |
| `transformers/fontFamilyToFigma.ts` | **Done** | Real `Transform` — font stack → Figma-ready string, with a per-token override option. |
| `transformers/fontWeightToNumber.ts` | **Done** | Real `Transform` — normalizes a fontWeight value (number or named string) to a plain number. |
| `filters/isNumber.ts` | **Done** | `token.$type === "number"` (pulled forward into Group 4, see above). |
| `filters/isFontFamily.ts` | **Done** | `token.$type === "fontFamily"`. |
| `filters/isFontWeight.ts` | **Done** | `token.$type === "fontWeight"`. |
| `types/typographyTokenValue.d.ts` | **Done** | TS type for a resolved typography composite value (used once typography is built, Group 10). |

**Also done:** `transformers/utilities/hasSpaceInStrings.ts` (Group 15, pulled forward — `fontFamilyToCss`/`fontFamilyToFigma` depend on it).

## Group 6 — CubicBezier, duration (same source file, same effort)

| File | Status | What it does |
|---|---|---|
| `schemas/cubicBezierToken.ts` | **Done** | Full `cubicBezier` token schema — 4-number array or reference. |
| `schemas/durationValue.ts` | **Done** | Validates `{value: number, unit: "ms"\|"s"}`. |
| `schemas/durationToken.ts` | **Done** | Full `duration` token schema. |
| `transformers/cubicBezierToCss.ts` | **Done** | Real `Transform` — `[a,b,c,d]` → `cubic-bezier(a,b,c,d)`. Fixed a real typo in Primer's own source (`'cubicBezeir/css'` misspelled transform name). |
| `transformers/durationToCss.ts` | **Done** | Real `Transform` — `{value, unit}` → CSS duration string, always output in ms. |
| `filters/isCubicBezier.ts` | **Done** | `token.$type === "cubicBezier"`. |
| `filters/isDuration.ts` | **Done** | `token.$type === "duration"`. |

## Group 7 — Shadow (needs color + dimension)

| File | Status | What it does |
|---|---|---|
| `schemas/shadowToken.ts` | **Done** | Full `shadow` token schema — one shadow object or array of them, each `{color, offsetX, offsetY, blur, spread}`. |
| `transformers/shadowToCss.ts` | **Done** | Real `Transform` — structured shadow object(s) → one CSS `box-shadow` string, comma-joining layers. |
| `filters/isShadow.ts` | **Done** | `token.$type === "shadow"`. |
| `types/shadowTokenValue.d.ts` | **Done** | TS type for a resolved shadow token's value shape. |
| `types/shadow.d.ts` | **Done** | TS type for one shadow layer object (a CSS string). |

**Pulled forward from Group 15:** `transformers/utilities/checkRequiredTokenProperties.ts` — `shadowToCss.ts` genuinely depends on it.

## Group 8 — Border (needs color + dimension)

| File | Status | What it does |
|---|---|---|
| `schemas/borderToken.ts` | **Done** | Full `border` token schema — `{color, width, style}` or reference. |
| `transformers/borderToCss.ts` | **Done** | Real `Transform` — composite border value → one CSS `border` shorthand string (`width style color` order). |
| `filters/isBorder.ts` | **Done** | `token.$type === "border"`. |
| `types/border.d.ts` | **Done** | TS type for a resolved border token — flagged a stale doc comment in Primer's own source (comment says "color \| style \| width", real code produces "width style color"). |
| `types/borderTokenValue.d.ts` | **Done** | TS type for the border composite value shape. |

## Group 9 — Transition (needs duration + cubicBezier)

| File | Status | What it does |
|---|---|---|
| `schemas/transitionToken.ts` | **Done** | Full `transition` token schema — `{duration, delay, timingFunction}`. |
| `transformers/transitionToCss.ts` | **Done** | Real `Transform` — composite transition value → one CSS `transition` shorthand string. |
| `filters/isTransition.ts` | **Done** | `token.$type === "transition"`. |

## Group 10 — Typography (needs dimension + fontWeight + fontFamily)

| File | Status | What it does |
|---|---|---|
| `schemas/typographyToken.ts` | **Done** | Full `typography` token schema — `{fontFamily, fontSize, fontWeight, lineHeight}`. |
| `transformers/typographyToCss.ts` | **Done** | Real `Transform` — composite typography value → a CSS `font` shorthand string. |
| `filters/isTypography.ts` | **Done** | `token.$type === "typography"`. |

## Group 11 — Gradient (needs color)

| File | Status | What it does |
|---|---|---|
| `schemas/gradientToken.ts` | **Done** | Full `gradient` token schema — array of `{color, position}` stops; direction via `org.cuboid.gradient.angle` (renamed from Primer's `org.primer.gradient`). |
| `transformers/gradientToCss.ts` | **Done** | Real `Transform` — color-stop array → a CSS `linear-gradient()` string. |
| `filters/isGradient.ts` | **Done** | `token.$type === "gradient"`. |

## Group 12 — Remaining schema types (confirm real cuboid need first)

| File | Status | What it does |
|---|---|---|
| `schemas/viewportRangeToken.ts` | **Done** | Primer's `custom-viewportRange` equivalent — checked, zero confirmed use in cuboid's real files, built anyway as real infrastructure. |
| `schemas/stringToken.ts` | **Done** | Primer's `custom-string` equivalent — checked, and it's REAL: 4 confirmed uses (`functional/size/layout.json5`'s `clamp(...)`, `functional/size/border.json5`'s embedded-reference `boxShadow.*`). Corrected `validTokenType.ts`'s wrong "no equivalent need" claim (same class of error as the earlier `fontWeight` mistake). |
| `schemas/designToken.ts` | **Done** | The discriminated union of every per-type schema above. Also fixed 2 real Zod v4 deprecation warnings while porting (`.passthrough()` → `.loose()`, `z.ZodIssueCode.custom` → the plain `"custom"` string literal, which is Zod v4's actual current API). |

## Group 13 — Remaining filters

| File | Status | What it does |
|---|---|---|
| `filters/isFromFile.ts` | **Done** | True if a token originated from a specific source file path — lets a platform build one output from a subset of files. |
| `filters/isDeprecated.ts` | **Done** | True if a token is marked deprecated — real infrastructure, no `$deprecated` authored yet in cuboid's real files. |
| `filters/isSource.ts` | **Done** | Primer's base filter applied to every real output file. |
| `filters/hasLlmExtensions.ts` | **Done** | True if a token carries an `org.cuboid.llm` extension. |

**Milestone: every filter in the pipeline is now real (17 of 17).**

## Group 14 — Remaining `.d.ts` types

| File | Status | What it does |
|---|---|---|
| `types/designToken.d.ts` | **Deleted** | Didn't exist in Primer's real `types/` at all — was cuboid's own stale stub duplicating what `schemas/designToken.ts` now correctly owns. Removed rather than kept as a second, conflicting source of truth. |
| `types/embeddedReferenceValue.d.ts` | **Done** | TS type for a `{path}` reference embedded inside a larger string value — rewrote to correct a stale note (claimed the resolver needed more work; Style Dictionary handles this natively, see DESIGN.md §3). |
| `types/tokenType.d.ts` | **Deleted** | Same reasoning as `designToken.d.ts` — real content lives in `schemas/validTokenType.ts`. Its old stub also had a stale 5-type list (predating the full 13+2 type build-out). |
| `types/platformInitializer.d.ts` | **Done** | TS type for a `platforms/*.ts` file's exported function signature. |
| `types/styleDictionaryConfigGenerator.d.ts` | **Done** | TS type for the shared config-generator helper's signature. |
| `types/tokenBuildInput.d.ts` | **Done** | TS type for one `{filename, source, include, theme}` build-input entry. |
| `types/w3cTransformedToken.d.ts` | **Done** | TS type narrowing `TransformedToken.$type` to the real 13 DTCG type strings. |

## Group 15 — Remaining transformer support utilities

| File | Status | What it does |
|---|---|---|
| `transformers/utilities/checkRequiredTokenProperties.ts` | **Done** (pulled forward, Group 7) | Asserts a token object has the properties its `$type` requires before a transformer touches it. |
| `transformers/utilities/getTokenValues.ts` | **Done** (pulled forward, Group 3) | Given an already-resolved token, pulls `$value` (or one composite sub-property), throwing if missing — NOT a resolver. |
| `transformers/utilities/invalidTokenError.ts` | **Done** (pulled forward, Group 3) | Constructs a clear, path-specific error for a malformed/missing token value. |
| `transformers/utilities/hasSpaceInStrings.ts` | **Done** (pulled forward, Group 5) | True if a string contains a space — used to decide if a font name needs quoting. |
| `transformers/figmaAttributes.ts` | **Done** | Corrected placement — real Primer file is top-level `transformers/`, not `transformers/utilities/` (caught after wrongly writing a duplicate at the wrong path first). Extracts `org.cuboid.figma` extension fields into a Figma Variables-ready shape. |
| `transformers/jsonDeprecated.ts` | **Done** | Corrected placement, same as above — top-level, not `utilities/`. Replaces a deprecated token's value with its replacement name. |

**Note:** the tracker's original path guesses for `figmaAttributes.ts`/`jsonDeprecated.ts` (`transformers/utilities/`) were wrong — real scaffolded location (matching Primer) is top-level `transformers/`. Fixed when writing these two.

## Group 16 — Remaining naming transforms

| File | Status | What it does |
|---|---|---|
| `transformers/namePathToCamelCase.ts` | **Done** | Token path segments → one camelCase key — for JSON output. |
| `transformers/namePathToDotNotation.ts` | **Done** (pulled forward, Group 3) | Token path segments → dot-notation string. |
| `transformers/namePathToFigma.ts` | **Done** | Token path segments → Figma's slash-path convention, collapsing 3-segment color-scale paths. |
| `transformers/namePathToPascalCase.ts` | **Done** | Token path segments → PascalCase key. |
| `transformers/namePathToSlashNotation.ts` | **Done** | Token path segments → slash-separated string. |

**Milestone: every naming transform is now real.**

## Group 17 — Output formats

| File | Status | What it does |
|---|---|---|
| `formats/cssAdvanced.ts` | **Done** | Resolved tree → one CSS file of `--cube-*` custom properties, theme-selector-scoped, with optional per-token `@media` grouping. Uses real Style Dictionary `utils` (`fileHeader`/`formattedVariables`/`sortByName`) + `prettier` — both already transitively available, no new deps needed. |
| `formats/jsonOneDimensional.ts` | **Done** | Resolved tree → a FLAT one-dimensional JSON object (dot-path → value). **Correction:** an earlier session decision said this would be the shared nested JSON format — wrong, Primer's own naming has this as the flat format; `jsonNestedPrefixed.ts` (below) is the real nested one and is what's actually shared. |
| `formats/jsonNestedPrefixed.ts` | **Done** | Resolved tree → one nested JSON file, prefixed if the platform declares one. **This is the actual shared format** between cuboid's own build (what `defaultTheme.ts` imports) and Task 4.5's app-facing theme compilation — corrected from the earlier wrong file-name assumption. |
| `formats/cssCustomMedia.ts` | **Done** | Viewport-range tokens → `@custom-media` CSS rules. No confirmed cuboid use yet — real infrastructure. |
| `formats/javascriptCommonJs.ts` | **Done** | Resolved tree → a CommonJS `module.exports = {...}` file. No current consumer (`packages/react` is ESM) — real infrastructure. |
| `formats/javascriptEsm.ts` | **Done** | Resolved tree → an ESM `export default {...}` file. Not what `defaultTheme.ts` uses (that's `jsonNestedPrefixed.ts`) — built for a consumer that specifically wants a real module, not a JSON import. |
| `formats/jsonFigma.ts` | **Done** | Resolved tree → a flat array of Figma Variable API objects (DESIGN.md §6). Fixed a real silent bug in Primer's source: `if (!$type) return` inside a `for...of` loop returned from the whole async function early, dropping every remaining token — changed to `continue`. |
| `formats/jsonPostCssFallback.ts` | **Done** | Flat `{"--token-name": value}` map for a PostCSS fallback plugin during a token migration. No current deprecated-token workflow — real infrastructure. |
| `formats/markdownLlmGuidelines.ts` | **Done, deliberately NOT a full port** | Primer's real file is 1,289 lines of hardcoded GitHub Primer domain knowledge (semantic meanings for "GitHub Sponsors," "open/closed/done PR states," category names like `controlKnob`/`spinner` that are Primer's own component vocabulary). User decision: ported the real, generic engine (grouping by category, deduplicating identical guidelines, compact table building) but left `CATEGORY_INFO` empty rather than populate it with GitHub's product concepts — populate with cuboid's own real categories as they're authored. |
| `formats/typescriptExportDefinition.ts` | **Done** | Generates compiled TypeScript type definitions, reading real `.d.ts` files from `src/types/` (e.g. `ColorHex` → `types/colorHex.d.ts` — confirmed this naming convention matches every type file already built). No current consumer (cuboid hand-writes its `.d.ts` types) — real infrastructure. |
| `formats/utilities/getPropName.ts` | **Done** | Returns `$value`/`value` etc. depending on DTCG vs. legacy tree shape. |
| `formats/utilities/jsonToFlat.ts` | **Done** | Flattens a token list to one-level dot-path keys. |
| `formats/utilities/jsonToNestedValue.ts` | **Done** | Rebuilds a nested tree collapsing every leaf to its resolved value — the actual shape `defaultTheme.ts` wants. |
| `formats/utilities/prefixTokens.ts` | **Done** | Wraps a token tree in one extra top-level key if the platform declares a prefix. |

**Milestone: every output format and its support utilities are now real (14 of 14).**

## Group 18 — Preprocessors (theme/dark-mode mechanism)

| File | Status | What it does |
|---|---|---|
| `preprocessors/inheritGroupProperties.ts` | **Done** | Propagates a shared `$description`/`$extensions` set on a group down to children that don't repeat it. |
| `preprocessors/themeOverrides.ts` | **Done** | Collapses a token's inline `$extensions['org.cuboid.overrides']` variants to one resolved value per theme at build time (the real dark-mode mechanism — DESIGN.md §5). Not yet wired into any real build — no theme data authored. |
| `preprocessors/utilities/transformTokens.ts` | **Done** | Shared recursive-rewrite helper `themeOverrides` uses to walk and replace tokens. |

**Milestone: every preprocessor is now real.**

## Group 19 — Platforms (one function per output target)

| File | Status | What it does |
|---|---|---|
| `platforms/css.ts` | **Done** | Composes transforms+formats+filters into up to 4 separate CSS files from one resolved tree (themed/non-themed/viewport-custom-media/coarse-fine-pointer), purely by filter. Most complex platform file. |
| `platforms/json.ts` | **Done** | The shared nested JSON platform `defaultTheme.ts` and app theme compilation both use. |
| `platforms/javascript.ts` | **Done** | CommonJS module output. |
| `platforms/typescript.ts` | **Done** | ESM module output. |
| `platforms/figma.ts` | **Done** | Figma-Variables JSON output — token eligibility checked via `org.cuboid.figma.collection` (renamed from Primer's `org.primer.figma`). |
| `platforms/fallbacks.ts` | **Done** | Deprecated-token fallback map. |
| `platforms/styleLint.ts` | **Done** | Stylelint-plugin-consumable data file. |
| `platforms/docJson.ts` | **Done** | Full-provenance docs/tooling JSON file. |
| `platforms/deprecatedJson.ts` | **Done** | Deprecated-tokens-only output. |
| `platforms/llmGuidelines.ts` | **Done** | Markdown LLM-guidelines doc output. |
| `platforms/typeDefinitions.ts` | **Done** | Compiled type-definitions output. |

**Milestone: every platform is now real (11 of 11) — all content groups in the pipeline are complete.** Format-name consistency across platforms/formats (e.g. `json/nested-prefixed`, `markdown/llm-guidelines`, `json/flat`) was verified as part of this session's work (all 4 real output platforms — `css`, `json`, `javascript`, `typescript` — built, run, and read by hand; no format-name mismatch found).

## Group 20 — Entry point and wiring

**RESOLVED (2026-10-07).** This group's two rows were stale — leftover from before the entry script existed, not an accurate description of current state.

| File | Status | What it does |
|---|---|---|
| `scripts/buildTokens.ts` | **Done** | The real, live build entry point (renamed from this doc's earlier `build-tokens.mjs` guess — see §"STATUS" above). Confirmed running correctly all session: `styleDictionary.extend({ include, source, platforms }).buildAllPlatforms()`, with `css`, `json`, `javascript`, and `typescript` platforms all wired in as of this session. |
| `package.json`'s `tokens:theme` | **Done** | Points at `scripts/buildTokens.ts` and runs clean, exit 0, verified by hand against real emitted files, not just the exit code. |

## Group 21 — Test infrastructure

**RESOLVED (2026-10-07), by a different path than originally planned.** This doc's original plan assumed real tests would need fake `TransformedToken`/dictionary/formatter-argument fixtures to mock Style Dictionary's internals. That assumption didn't hold: every real test built this session (`jsOutput.test.ts`, `exportsContract.test.ts`, `applyOverrides.test.ts`, `validateTokens.test.ts`, `tokenName.test.ts` — 35 tests across 5 new files) exercises real behavior directly — a real `buildAllPlatforms()` run into a temp directory, a real schema `safeParse()`, a real subprocess invocation against real or temp-fixture token files — rather than mocking Style Dictionary's internal types. The 4 planned mock-fixture files were never needed and are not being built; this group is closed, not deferred.

| File | Status | What it does |
|---|---|---|
| `test-utilities/getMockToken.ts` | **Not needed** | Superseded — real tests hit real Style Dictionary behavior instead of mocking its fixture shapes. |
| `test-utilities/getMockDictionary.ts` | **Not needed** | Same reasoning. |
| `test-utilities/getMockFormatterArguments.ts` | **Not needed** | Same reasoning. |
| `test-utilities/getMockParserInput.ts` | **Not needed** | Same reasoning. |

---

## Summary counts (as of 2026-09-23, Groups 20-21 corrected 2026-10-07)

- **Done:** 140 (Groups 1-17: 124 files (see prior entries); Group 18 preprocessors: 3 files; Group 19 platforms: 11 files; Group 20 entry script: 1 file + 1 npm-script wiring; `tsconfig.json` raised to ES2022 target/lib for `Object.hasOwn` support — config change, not a file)
- **Not started:** 0
- **Not needed (superseded by a different, real approach):** 4 — Group 21's planned mock-fixture files; see that group's entry above for why.
- **Milestone: every content group is complete, AND the pipeline runs end to end.** All 13 DTCG types, both custom types, every filter/schema/type/transformer/preprocessor/format/platform/entry-script is real, and `npm run tokens:theme` produces real, hand-verified output (`dist/css/theme.css`, `dist/tokens.json`, `dist/js/tokens.js`, `dist/cjs/tokens.js`).
- **Milestone:** all 13 W3C DTCG `$type`s AND both of Primer's real custom types now have complete schemas — every schema in cuboid's real token vocabulary is done, AND (as of 2026-10-07) actually wired into a real validator (`scripts/validateTokens.ts`), not just defined.
- **New dependencies added this session (2026-09-23):** `colorjs.io`, `color2k` (both real, user-approved — W3C color-space math and alpha blending are genuinely hard to hand-roll correctly). **Added 2026-10-07:** `json5` (direct dependency, for `validateTokens.ts`'s own file parsing — previously only resolved transitively via Style Dictionary).
- **Config change:** `tsconfig.json` gained `allowImportingTsExtensions`/`emitDeclarationOnly`, dropped `outDir` — needed so `.test.ts` files (and the entry script) can resolve relative imports under Node's native TS execution. Existing source files' own internal imports have NOT yet been updated to use `.ts` extensions — deferred until actually needed.
- **Deleted (old pipeline, not part of this count):** `build-theme.mjs` + 3 sibling files, 2,527 lines

## Finish line

**Reached (2026-10-07).** `npm run tokens:theme` succeeds end-to-end, both for Style Dictionary's build and for the independent schema validator, with real output verified by hand, not just a green exit code. Remaining primitives work (dark-mode theme data, ~18 lower-urgency `GAP:` markers, the deferred React-layer retirement) is tracked in `DESIGN.md` §5 and this doc's "Real remaining work" section above — none of it blocks calling this pipeline rebuild done.
