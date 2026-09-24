# Primitives pipeline tracker

Source of truth for which `packages/primitives/src/*` pipeline files are real vs. still a stub. Companion to `token-migration-tracker.md` (which tracks token *content* correctness per component) — this tracks the pipeline *code* that reads/validates/transforms/emits that content, a separate axis. Build order and full design context live in `packages/primitives/DESIGN.md` §7 — this file is the scannable status table that doc doesn't have.

**Status values:** `Done` (real logic, typechecked) → `Not started` (stub only, throws "not implemented").

Update the status column as files are implemented. Don't delete rows — this is the permanent record of the rebuild.

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

**Milestone: every platform is now real (11 of 11) — all content groups in the pipeline are complete. Only the entry script (Group 20) and deferred test mocks (Group 21) remain.** Format-name consistency across platforms/formats (e.g. `json/nested-prefixed`, `markdown/llm-guidelines`, `json/flat`) needs final verification when `styleDictionary.ts` registers everything in Group 20 — noted as a real open item, not yet double-checked.

## Group 20 — Entry point and wiring

| File | Status | What it does |
|---|---|---|
| `scripts/build-tokens.mjs` | Not started | The real build entry point — configuration only (Style Dictionary does merge/resolve/transform/emit internally). Constructs `StyleDictionary.extend({source, platforms}).buildAllPlatforms()` calls using the platforms from Group 19. |
| `package.json`'s `tokens:theme` | **Done** (pre-wired) | Already points at `scripts/build-tokens.mjs` — will run correctly once that file exists. |

## Group 21 — Test infrastructure (build alongside first real test, not before)

| File | Status | What it does |
|---|---|---|
| `test-utilities/getMockToken.ts` | Not started | Builds a fake `TransformedToken` fixture for unit tests. |
| `test-utilities/getMockDictionary.ts` | Not started | Builds a fake resolved token dictionary fixture. |
| `test-utilities/getMockFormatterArguments.ts` | Not started | Builds fake arguments matching a Style Dictionary format function's signature. |
| `test-utilities/getMockParserInput.ts` | Not started | Builds fake raw `.json5` parser input. |

---

## Summary counts (as of 2026-09-23)

- **Done:** 138 (Groups 1-17: 124 files (see prior entries); Group 18 preprocessors: 3 files; Group 19 platforms: 11 files; `tsconfig.json` raised to ES2022 target/lib for `Object.hasOwn` support — config change, not a file)
- **Not started:** 5 (excludes 2 deleted files — `designToken.d.ts`, `tokenType.d.ts`) — the entry script (Group 20, 1 file) + all 4 test mocks (Group 21, deferred)
- **Milestone: every content group is complete.** All 13 DTCG types, both custom types, every filter/schema/type/transformer/preprocessor/format/platform is real. The ONLY remaining implementation work is Group 20's entry script — writing it and wiring `npm run build` is the actual finish line for this entire rebuild.
- **Milestone:** all 13 W3C DTCG `$type`s AND both of Primer's real custom types now have complete schemas — every schema in cuboid's real token vocabulary is done. Second confirmed instance of the "unverified no-current-use claim" error this session (`custom-string`, following `fontWeight` earlier) — both caught by actually grepping real token files before trusting an existing comment.
- **New dependencies added this session:** `colorjs.io`, `color2k` (both real, user-approved — W3C color-space math and alpha blending are genuinely hard to hand-roll correctly).
- **Config change:** `tsconfig.json` gained `allowImportingTsExtensions`/`emitDeclarationOnly`, dropped `outDir` — needed so `.test.ts` files (and eventually the entry script) can resolve relative imports under Node's native TS execution. Existing source files' own internal imports have NOT yet been updated to use `.ts` extensions — deferred until actually needed (tests paused mid-Group-1 per user direction: write all tests in one pass once implementation is done).
- **Deleted (old pipeline, not part of this count):** `build-theme.mjs` + 3 sibling files, 2,527 lines

## Finish line

`npm run build` succeeds end-to-end once Group 20's entry script exists and runs clean against everything above it.
