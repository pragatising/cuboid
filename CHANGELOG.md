# Changelog

Rolling session log for Claude Code continuity. Newest entry on top. Each entry: what changed, why, and anything the next agent needs to know. Keep entries short — skip anything derivable from `git log` or the diff itself.

## 2026-09-25 (end of day, follow-up) — Pill intensity casing

**Changed:**
- `extralight` -> `extraLight` across the pill intensity scale, fixed at `scripts/generate-pill-shade-tokens.mjs` and regenerated (11 hue files). It was the only non-camelCase key in a set whose sibling is `extraBold`.

**Next agent:**
- `packages/react` still says `extralight` in `Pill.stories.tsx`, `Table.stories.tsx`, and the orphaned `theme/output/components.css`. Deliberately not fixed — React is being rewritten wholesale, and `components.css` is a Sep 12 generated file nothing can regenerate.

## 2026-09-25 (end of day) — All component tokens DTCG, functional-only: 146 broken refs and 134 base reach-throughs to zero

**Changed:**
- **Every component token folder is now DTCG (`$value`/`$type`) and references the FUNCTIONAL layer only.** Before: 146 broken references, 134 base reach-throughs, 11 legacy-format components, and 8 components emitting zero tokens. After: all zero, all 25 components in the output. Leaf values went 799 -> 1138 (the 8 silent components now actually build).
- **Bulk remap of 17 dead `color.*` paths** onto the current functional layer (`color.canvas.transparent` -> `bgColor.canvas.transparent`, `color.text.contrast` -> `fgColor.neutral.contrast`, `color.border.gray.2` -> `borderColor.muted`, …) plus `displaySizes.N` -> `size.N` left over from the namespace merge. Those paths were deleted in the Sep 13 functional rebuild and never updated — 25 files touched.
- **Pill fixed at the generator** (`scripts/generate-pill-shade-tokens.mjs`), not in its 12 outputs. It wrote to `tokens/functional/components/pill` (a path that no longer exists), emitted legacy format, and reached into `base.color.scale.*`. Now emits DTCG `.json5` into `src/tokens/components/pill` referencing `display.<hue>.scale.*`. Also fixed a latent bug: `fgHue: "magenta"` pointed at a hue key that does not exist (it is `mag`), and `display.<hue>.fgColor` is a single value, not the role map the generator assumed.
- **`display.gray.scale` extended from 10 to 13 steps.** Base gray has 14 (0-13) while the chromatic hues have 11, and pill's `extraBold` legitimately needs step 12. This was a real functional-layer gap, so the fix is exposing the steps — not letting a component reach into base to get them.
- **`link` re-rooted from `color.link.*` to `link.*`.** Its old `color.*` wrapper (pre-rebuild taxonomy) made it merge into a stray top-level `color` key instead of appearing as a component like every other one.
- Remaining 9 components converted to DTCG with `$type` inferred from the reference target; raw CSS values that DTCG's dimension type cannot express (`90vh`, `min(90vw, 56rem)`) typed `custom-string` with a note, same pattern as `container`.

**Why:**
- Components reaching into `base/` is not a style violation, it is broken output: base is `include`-only in this build (resolvable, never emitted), so a `{base.*}` reference in a component has no CSS variable to point at. And 8 components producing zero tokens was invisible — nothing failed, they simply were not in the output.

**Next agent:**
- **This had to happen before generating types.** A token union built over the previous state would have omitted 8 components entirely and frozen the broken taxonomy into the public API.
- `functional/typography/typography[DEPRECATED].json` is the only legacy-format file left anywhere. The filename says it is deliberate — ask before removing it.
- `components/highlight/color.json5` still holds 4 raw hex values, each with a `$description: 'GAP: ...'` explaining that no base color is a close match (deliberately more saturated than the UI palette). These are honest design decisions, not bugs, but they are the last non-tokenised colors in the component layer.
- Shadow composited alphas are structurally correct but were never cross-checked against Figma — worth verifying if shadows are design-critical.
- Still unwired: the 27 Zod schemas (nothing calls them — this is the gate that would have caught the 146 broken refs at authoring time) and `platforms/typescript.ts` + `typeDefinitions.ts`.

## 2026-09-25 (later still) — One size vocabulary: Nx scale + xxs..xxl ladder

**Changed:**
- **`display-sizes.json5` merged into `size.json5` and deleted.** Both declared the root key `size:`, so Style Dictionary always merged them into one namespace at build time — two files, one tree, and the filename `display-sizes` appeared nowhere in the output.
- **The raw scale is now proportional (`Nx`, 1x = 8px base unit) in the JSON output.** Tokens stay AUTHORED by px (`size.1`, `size.24`) because that is what the value literally is, and because `.` is Style Dictionary's path separator — authoring `0.125x` nests the token as `size -> 0 -> 125x` and silently corrupts every reference (hit this for real; CSS survived while the JSON tree was wrong, which is exactly the class of bug a green build hides). The two consumers get different names from the same token, per user decision:
  - CSS  -> `--cube-size-1px`, `--cube-size-24px` (guarded branch in `transformers/nameToKebabCase.ts`)
  - JSON -> `size["0.125x"]`, `size["3x"]` (new `formats/utilities/pxKeyToNx.ts`)
  Both only touch bare-integer keys under a `size` group, so no other token name can be altered.
- **One vocabulary across every size-like scale**, replacing four that disagreed (`xxs/xs/sm/md/lg/xl` vs `xSmall/small/medium/large/xlarge` vs `extraSmall/...` vs `small/medium/large`): `size.control`, `iconButton`, `heading.size`, `text.size`, `shadow.floating`, `borderRadius`, `space`, and functional typography all now use the `xxs..xxl` ladder.
- `borderRadius` gained **`none`** (0) and **`xxl`** (32px); `full` (9999px) deliberately stays outside the scale — it is a shape intent, not a step.
- `space` now starts at **4px** and runs to 48px (`xxs 4, xs 8, sm 12, md 16, lg 24, xl 32, xxl 48`). 2px is below the ladder by design; the three call sites that genuinely need it (tooltip `gap`/`paddingBlock`, inline-code-snippet `paddingInline`) reference `{size.2}` directly — confirmed correct by the user, values preserved rather than silently becoming 4px.

**Why:**
- `sm`/`md`/`lg` meant *different values on different scales* — `radius.medium` was 8px while `space.md` was 12px — so a shared vocabulary implied a shared scale that did not exist. That mismatch is what forced per-component translation tables like `SIZE_TO_CONTROL` in `Button.tsx`. An `Nx` key IS its value (`3x` is always 24px), so the collision disappears; semantic names remain as aliases that carry intent for their own scale.

**Next agent:**
- **`medium` is not always a scale step.** Two renames were wrong and were reverted: `base.text.weight.medium` is a FONT WEIGHT (sits alongside `light/normal/semibold`), and `motion.duration.medium` is a TIME (sits between `short` and `long`). The latter broke the build via a dangling reference — caught by the strict gate, which is what it is for. Restrict this vocabulary to genuinely size-like scales.
- **`packages/primitives/src/tokens/base/` is untouched and must stay that way** — base is raw px values by explicit user decision. Verified clean (`git diff --stat` on that path is empty).
- React is knowingly stale and will be rewritten wholesale — `BoxBorderRadius`, the half-finished `Responsive<\`${number}x\`>` type, and 23 pre-existing typecheck errors all still reference the old vocabulary. Not worth fixing piecemeal.
- Verified after the rename: build exits 0, 0 transform errors, 799 leaf values with 0 malformed, 53/53 tests.

## 2026-09-25 (later) — Build output moved into primitives; dead Figma stub deleted

**Changed:**
- **Token build output moved out of `packages/react`.** It was written to `packages/react/src/theme/output/`, inherited from before the Phase -1 workspace split when tokens and React shared one package. That inverted the dependency (react depends on primitives, so primitives must not depend on react's directory layout) and made the output unconsumable by anything but react. Now `packages/primitives/dist/` — `dist/css/theme.css` + `dist/tokens.json`, matching Primer's published shape.
- `packages/primitives/package.json` gained real `exports` + `files`, so the package is actually consumable: `@sragatiping/cuboid-primitives/css/theme.css` resolves through the workspace link (verified). Deliberately **no `types` export yet** — `dist/tokens.d.ts` doesn't exist until the `typeDefinitions` platform is wired, and an export must not claim a file the build doesn't produce.
- `.storybook/preview.ts` repointed from the relative path to the package export.
- **Closed a latent gap the move exposed:** `dist/` is gitignored, so output is no longer committed — correct for build artifacts, but only `build` had a `prebuild` hook. `dev`, `storybook` and `build-storybook` never regenerated tokens, so a fresh clone would have found none. Added `predev`, `prestorybook`, `prebuild-storybook`.
- **Deleted `packages/react/src/theme/figma/`** and its re-export from `src/index.ts`. Both functions were stubs that just `return defaultTheme`, with zero internal callers, unused by portfolio (the only consumer), and primitives already has the real `platforms/figma.ts` + `formats/jsonFigma.ts`.

**Why:**
- Doing this now was deliberate: `tokens.json` has no consumers yet, so moving it is free. Once `defaultTheme.ts` or generated types import it, relocating becomes a breaking change across both packages.

**Next agent:**
- **Nothing else in `packages/react/src/theme/` is safe to delete yet**, despite looking like clutter. Verified by real import sites, not name matching: `types.ts` (40), `tokenOutput.ts` (13), `globalColor.ts` (9), `defaultTheme.ts` (6), and `base.json`/`theme.json`/`token-output.json` (1 each, imported by `defaultTheme.ts`). `components.css`/`icon-fonts.css` are still imported by Storybook. These are the live theme layer running on frozen Sep 12 data — they can only go once the pipeline replaces what they provide.
- The unlock is `types.ts`: 811 hand-written lines that the `typeDefinitions` platform should generate. Swapping that is what makes deleting the rest possible.
- **`packages/react` typecheck fails with 23 errors at HEAD** — pre-existing, unrelated to this work (verified by stashing and re-running: 23 before, 23 after). Most are `Type '"none"' is not assignable to type 'Responsive<`${number}x`>'`, i.e. **a half-finished `Nx` sizing type for Box that does not typecheck**. Directly relevant to the open vocabulary decision below.
- **Open decision, deliberately not made:** unify the size vocabulary. Four spellings of one concept exist today — `space` uses `xxs/xs/sm/md/lg/xl`, `radius` uses `xSmall/small/medium/large/xlarge/full`, `size.control` uses `extraSmall/small/medium/large`, typography uses `small/medium/large`. React props already diverged to the abbreviated form, which is why `Button.tsx` carries a hand-maintained `SIZE_TO_CONTROL` bridge. User has chosen `xxs–xxl` everywhere; still unsettled: the px value for a new `xxl` (space stops at `xl`=24px), and whether `radius`/`control` map onto existing steps or get padded to uniform keys.
- On `Nx` (e.g. `1x`/`2x` as 8px multiples): **the scale is not 8-based.** Below 24px it steps by 1px, and `space.xxs`=2px, `space.xs`=4px, `space.md`=12px are not multiples of 8 — so `Nx` cannot express the three most-used spacing values. The existing `NamedStep | SpaceToken` union (already used by `Stack` and `Pill`) covers all 48 `size.*` steps and is the better escape hatch.

## 2026-09-25 — Token pipeline runs green: both CSS + JSON output, transitive double-transform bug fixed

**Changed:**
- All 145 `packages/primitives/src` files implemented (previous session), then this session actually got `npm run tokens:theme` to exit 0 with **0 transform errors** and both outputs written: `theme.css` (783 vars) + `tokens.json`.
- **Root cause of the main bug, corrected from the previous session's diagnosis.** It is NOT base-layer-specific. Style Dictionary resolves references and transforms values in the same repeated pass over one shared token map, so any token that resolves FROM an already-transformed token receives the transformed value. Verified on a functional→functional alias with no base token involved (`container.maxWidth.page` → `{layout.pageMaxWidth}`, both in `functional/`). The previous session's `filters/isBaseToken.ts` therefore patched the wrong axis and has been deleted.
- **Fix: make the transitive transforms idempotent.** New `transformers/utilities/isAlreadyTransformed.ts`; guard applied in `dimensionToRem`, `dimensionToPixelUnitless`, `dimensionToRemPxArray`, `durationToCss`, `cubicBezierToCss`, `typographyToCss`. Rejected alternatives, both tested rather than reasoned about: dropping `transitive` cleared the 208 errors but emitted `[object Object]` for every aliased dimension; a base-token filter leaves functional→functional aliases broken.
- **Fixed a silent output corruption `shadowToCss` was producing:** every shadow emitted `undefinedundefined ...` for offsets/blur/spread. Its `dimensionToCss` read `.value`/`.unit` off values that, being references to `base.size.*`, had already been converted to CSS strings. Same root cause, different call site. The transform never threw, so the build stayed green while emitting garbage — audited all 795 emitted leaf values afterward: 0 malformed.
- **Made the build a real gate.** Style Dictionary does NOT fail on transform errors — it logs, substitutes the untransformed value, and exits 0, which is how 224 errors sat behind a green exit code. `buildTokens.ts` now sets `log.warnings: "error"` + `errors.brokenReferences: "throw"`. Two expected warnings are downgraded per-platform, each with an in-file rationale: multi-layer shadow refs (css) and name collisions the nested format never reads (json).
- `base/` moved from `source` to `include` (matches Primer): resolvable but never emitted, so 702 `--cube-base-*` vars no longer leak into public CSS, enforcing "components consume functional tokens, never reach into base."
- Dropped 3 of the 4 CSS output files inherited from Primer's `platforms/css.ts` — each matched zero cuboid tokens (no theme data authored, no `custom-viewportRange` tokens, no `size-coarse`/`size-fine` files). The themed one is the first to re-add when dark mode lands.
- `scripts/build-tokens.mjs` → **`scripts/buildTokens.ts`** (matches Primer, and the 145 `.ts` files it belongs to). It was the only untypechecked file in the pipeline despite importing `.ts` directly; new `tsconfig.typecheck.json` covers `src` + `scripts` (the emit config's `rootDir: "src"` makes including `scripts/` impossible), wired into `npm test` as a `typecheck` script.
- New `src/transformers/idempotence.test.ts` — 9 regression tests, verified to fail 9/9 without the fix.

**Why:**
- Running the pipeline for the first time is what surfaced all of this. Note the pattern worth carrying forward: a green exit code proved nothing here. Two separate real bugs (224 transform errors, then the `undefined` shadows) were invisible behind `exit 0`, and were only found by reading emitted values.

**Next agent:**
- `npm test` = no-react guard + typecheck + 53 tests, all passing. `npm run tokens:theme` exits 0.
- **Token content, not pipeline — the real remaining work.** The build globs `*.json5` only, so **19 `.json` files are silently invisible** and 7 components emit zero tokens: `link`, `overlay`, `pill`, `resize-handle`, `sheet`, `sidebar`, `site-header`. 12 are also still legacy format (`"value"`, not `$value`). Widening the glob is one line but surfaces all 12 at once — its own task. For `pill/*` fix the generator (`scripts/generate-pill-shade-tokens.mjs`), not the 12 outputs.
- **All 27 Zod schemas exist and nothing calls them.** That is why token-content bugs reach a transform instead of failing validation. Wiring them is the next real gate.
- ~20 `$description: 'GAP: ...'` markers are deliberate self-flags, not oversights. Two with visible UI impact: `z-index` needs `base.zIndex.700/800/900` (scale stops at 600), and `button`/`icon-button` disabled borders fall back to `borderColor.subtle` so disabled looks identical to rest/hover.
- `src/filters/isBaseToken.ts` was **deleted**. It was invented the previous session as a workaround for the bug above and never existed in Primer (their `filters/` has no such file). Its concept is `isSource`, which cuboid already wraps — verified as an exact inverse across all 1047 tokens. Note the design point it got wrong: Primer filters transforms by TYPE only (`isDimension`, `isCubicBezier`); token layer is an output concern (which file a token lands in), never a transform concern.
- `platforms/typescript.ts` + `typeDefinitions.ts` are implemented but unwired. Wiring them is the next planned step: `tokens.json` already gives importable *values*, these add the *types* that make token-valued component props autocomplete and fail at compile time on a typo.
- React is deliberately untouched and stays broken until the rebuild reaches it. `defaultTheme.ts` still imports `theme.json`/`base.json`/`token-output.json` — Sep 12 files that **nothing can regenerate** (their scripts were deleted). Do not untrack or delete those; they are the only copy.

## 2026-09-23 — Real pipeline implementation begins; old hand-rolled build deleted; docs consolidated

**Changed:**
- Implemented for real (no longer stubs): `utilities/treeWalker.ts`, `utilities/log.ts`, `schemas/baseToken.ts`, `referenceValue.ts`, `tokenType.ts`, `validTokenType.ts`, `tokenName.ts` — the generic tree walker and shared schema foundation every per-type schema will extend. `validTokenType`'s list is scoped to the real 13 W3C DTCG types (dropping Primer's org-specific `custom-string`/`custom-viewportRange`).
- **Deleted outright** (not ported, not kept for compatibility): `scripts/build-theme.mjs`, `build-theme-css.mjs`, `build-component-theme-css.mjs`, `build-typography-theme.mjs`, `scripts/lib/spaceScale.mjs`, and their one test file — 2,527 lines of hand-rolled merge/resolve/emit logic. `package.json`'s `tokens:theme` now points at `scripts/build-tokens.mjs` (not yet written).
- **Key finding, changes the whole remaining plan:** Style Dictionary (already installed, v5.5.3) resolves `{path}` references natively — recursively, embedded-reference-aware, with real circular-reference detection — verified directly against `node_modules/style-dictionary/lib/utils/references/resolveReferences.js` and against Primer's real `scripts/buildTokens.ts` (300+ lines, zero hand-rolled resolution — pure `StyleDictionary.extend({...}).buildAllPlatforms()` configuration calls). There was never a resolver to build; the old plan's "step 3: build the resolver" is gone.
- New `docs/knowledge/w3c-design-token.md` — real content (was an empty stub), the 13 standard DTCG `$type`s pulled from the actual W3C spec, used as the reference for scope instead of grepping whatever the token files happen to contain mid-rebuild.
- **Docs consolidated to one file per user request:** `docs/token-architecture-migration.md` (original migration plan) and a short-lived `docs/backlog/token-pipeline-implementation-strategy.md` (created and deleted same session) both merged into `packages/primitives/DESIGN.md`, now the single source of truth for design + verified Primer research + Figma-sync plan + build order. `docs/token-architecture-migration.md` deleted outright (was tracked in git — real removal, not just untracked cleanup). `docs/backlog/token-migration-tracker.md` deliberately kept separate — it's a live per-component token-status table, not a plan doc, so it doesn't belong merged into DESIGN.md.

**Why:**
- Scaffolding-parity work (previous entries) got every file's SHAPE matching Primer; this session started actually implementing them. Mid-implementation, a real error surfaced: `fontWeight` had been marked "no current use, defer it" without checking `packages/react/src` first — it's real and shipping (`Text.tsx`, live `theme.css` output). Per explicit user instruction after that error, the plan changed from "build ~30 of ~150 files, defer the rest by judgment" to "implement every scaffolded file, no unilateral skip decisions."

**Next agent:**
- `docs/backlog/token-migration-tracker.md` (component-token DTCG-format status, a separate older doc) was NOT touched this session — still reflects pre-rebuild state, don't confuse it with the new `DESIGN.md`.
- `DESIGN.md` §7 has the full 33-step build order — currently at step 5 (done: treeWalker, log, schema foundation). Next: generic utilities (toCamelCase, toPascalCase, etc.), then shared schema building blocks (alphaValue, collections, scopes, llmExtension), then color.
- `npm run build` is still broken — `scripts/build-tokens.mjs` doesn't exist yet. This is expected; nothing regressed, the old broken state and the new one just point at a different missing file.
- Undecided still: whether `docs/token-architecture-migration.md` gets deleted outright or kept as a superseded pointer (asked, not yet answered as of this entry).

<!--
Template for a new entry:

## YYYY-MM-DD — Short title

**Changed:** one or two lines, files/areas touched.
**Why:** the actual motivation, not just "fixed bug."
**Next agent:** open threads, deferred decisions, known debt, or nothing if clean.
-->

## 2026-09-14 — Scaffold Primer-parity folders in `packages/primitives/src`: filters, formats, preprocessors, platforms, schemas

**Changed:**
- Added 58 stub files (all throw `"not implemented"`, header comment names the Primer equivalent) across five new folders: `filters/` (11), `formats/` (7), `preprocessors/` (2), `platforms/` (11), `schemas/` (27) — mirrors `github.com/primer/primitives`'s real `src/` structure exactly (verified against the live repo via `gh api`, not guessed).
- `types/` and `utilities/` already had stubs from the 2026-09-12 Phase 0 scaffold; untouched this session.
- Nothing wired up — no build script references any of these yet, no transform/format/schema is registered on `styleDictionary.ts`. Pure scaffolding, zero behavior change, matches the existing stub convention (`treeWalker.ts`, `log.ts`).

**Why:**
- Auditing cuboid's Task 1 (fix the broken token build) against Primer's real source surfaced that cuboid's original scaffold only anticipated `transformers`/`types`/`utilities`/`schemas` — missing Primer's `filters` (routes tokens into different output files from one resolved tree, e.g. themed vs. non-themed CSS) and `platforms` (one function per output target, composing transforms+formats+filters) entirely. Both are real structural gaps, not optional extras — `platforms/css.ts` in Primer's real code shows one platform producing 4 differently-filtered output files from a single resolved tree, which cuboid's current one-monolithic-script Task 1 plan can't do without this shape.

**Next agent:**
- Every file here is an empty throw-stub — this is folder/file-shape parity only, not implementation. See `docs/token-architecture-migration.md` for the pipeline design and the in-session Task 1 spec (not yet committed to the repo, lives in the conversation/scratchpad) for the real `$type` inventory found on disk (7 types in use — `color`, `dimension`, `number`, `fontFamily`, `shadow`, `cubicBezier`, and a likely `duration` — vs. DESIGN.md's originally documented 5) and the reference-resolution edge cases (embedded refs inside larger strings, `{value, unit}` object-shaped dimensions, `alpha` as a sibling key on color) that the real transformers need to handle.
- `npm run build` is still broken (old `tokens:theme` script points at the now-deleted old `tokens/` path) — this scaffolding doesn't fix that yet, it's groundwork for the real Task 1 implementation pass.

**Follow-up (same day) — completed full parity, including two subfolder levels the first pass missed:**
- Fetched Primer's complete recursive tree via `gh api repos/primer/primitives/git/trees/main?recursive=1` and diffed it file-by-file against cuboid's tree (159 real non-test, non-token-data files on Primer's side) — the first pass's `gh api .../contents/src/<dir>` calls only listed one level deep and silently missed two nested subfolders: `formats/utilities/` (4 files: `getPropName`, `jsonToFlat`, `jsonToNestedValue`, `prefixTokens`) and `preprocessors/utilities/` (1 file: `transformTokens`).
- Also closed 12 individual files the first pass's manual transcription missed: `filters/` (`hasLlmExtensions`, `isColorWithAlpha`, `isFontWeight`, `isGradient`, `isTransition`, `isTypography`), `formats/` (`jsonPostCssFallback`, `markdownLlmGuidelines`, `typescriptExportDefinition`), `schemas/designToken`, `transformers/borderToCss`, `types/shadow.d.ts`.
- Also created a new `test-utilities/` folder (didn't exist at all) with Primer's 4 real files (`getMockDictionary`, `getMockFormatterArguments`, `getMockParserInput`, `getMockToken`), and filled remaining gaps in top-level `utilities/` (9 files) and `transformers/` + `transformers/utilities/` (23 files) that the first pass's folder list didn't cover in this level of detail.
- Confirmed via bidirectional diff: full parity now holds. Intentional differences only — `styleDictionary.ts` (≈ Primer's `primerStyleDictionary.ts`), 3 renamed-not-missing files (`nameToKebabCase`↔`namePathToKebabCase`, `getTokenValues`↔`getTokenValue`, `hasSpaceInStrings`↔`hasSpaceInString`), no `index.ts` barrels anywhere (matches this repo's own no-barrel standard).
- **Lesson for next agent doing a similar audit:** a single-level `gh api contents/<dir>` listing does not reveal nested subfolders — use the recursive git-trees endpoint (`git/trees/<branch>?recursive=1`) and a real file diff from the start, not manual screenshot transcription.
- Still nothing wired up or implemented anywhere in this scaffold — same caveat as above, `npm run build` remains broken until the real Task 1 implementation pass.

## 2026-09-13 — Functional token layer: DTCG format, `org.cuboid.*` namespace, real base-token aliasing

**Changed:**
- Namespace: `org.primer.*` → `org.cuboid.*` across 6 functional files (`motion.json5`, `typography.json5`, `border.json5`, `font-stack.json5`, base `easing.json5`, base `typography.json5`) — leftover from whatever this content was forked/adapted from.
- DTCG conversion (`"value"` → `$value`/`$type`): `radius.json5`, `layout.json5`, `outline.json5`, `breakpoints.json5`, `z-index.json5`.
- Rebuilt `functional/size/size.json5` from scratch — was self-referential garbage (`{size.space.24}`, `{size.size.control.iconButton...}`, neither resolving). Now correctly aliases `space.*`/`size.*`/`borderRadius.*`.
- Added `size.0` step to `display-sizes.json5` (didn't exist; needed for "none" gap/padding cases).
- Fixed `base.color.scale.*` → `base.color.*` (no `.scale.` level exists in base) across `bgColor.json5`, `borderColor.json5`.
- Rebuilt `bgColor.json5`: `canvas.*` unchanged; added `neutral.light.1-4` (→ `gray.0-3`) and `neutral.inverted.1-4` (→ `gray.13-10`, darkest first) replacing an old `bg.gray.light/dark` shape; added full connotation set (`informational/debug/notice/success/emergency/critical/alert/error/warning`), each with exactly `subtle=hue.0, muted=hue.3, strong=hue.9`.
- Rebuilt `borderColor.json5`: flattened the `positive`/`negative`/`neutral` sentiment wrapper (it didn't hold — `boost` isn't positive/negative, `debug` isn't either) to flat `borderColor.<name>.*`, dropped `boost` entirely.
- Rebuilt `fgColor.json5` to match: same flat category names as `borderColor`, `subtle/muted/strong` at `hue.4/6/9` (darker than bgColor's `0/3/9` — text needs contrast, fills don't). Renamed `neutralBase` → `neutral` (was disambiguating from the old `neutral.*` status wrapper, which no longer exists after flattening). Dropped `fgColor.text.*` — byte-identical duplicate of `fgColor.neutral.*`, confirmed unreferenced before removal.
- Rebuilt `functional/border/border.json5` (was pasted from Primer wholesale, referenced GitHub-specific concepts — `open`/`closed`/`draft`/`sponsors`/`upsell`/`accent` — with no matching `borderColor` entry). Now mirrors `borderColor.json5`'s real flat keys exactly.
- Rebuilt `syntax.json5` as fully per-language (`syntax.{json,typescript,html,css,markdown}.*`), each carrying only tokens that apply to that language's actual grammar — was one flat 40-key list mixing code-grammar, markdown/diff, and (wrongly) inspector-UI colors together.
- New `components/code-block/code-block.json5` — the inspector/data-table UI tokens (`rowHoverBg`, `watchMark*`, `carriageReturn*`, `invalidIllegal*`, `bracketHighlighter*`) that were misfiled in `syntax.json5` moved here; `codeBlock` had no token folder despite being referenced in `functional/typography/typography.json5`.
- Rebuilt `icon.json5`, `stack.json5` (components) — both had broken alias paths (`{displaySizes.N}`, ambiguous `{size.N}`) now pointing at real `display-sizes.json5` entries.
- Rebuilt `icon-button/ghost.json5` + `icon-button/outlined.json5` (replacing old `.json` versions, deleted) — dropped the redundant `color` wrapper (`iconButton.ghost.*` not `color.iconButton.ghost.*`), renamed `base` state → `default`, real functional-token paths throughout (`bgColor.informational.*`, `fgColor.neutral.*`) instead of raw `base.color.scale.blue.*` reach-through and stale `color.bg.gray.light.*` paths.
- Fixed `.claude/hooks/changelog-check.sh` — was still watching top-level `src`/`scripts`, which moved to `packages/primitives/src` and `packages/react/src` in the Phase-1 workspace split; the hook has silently not fired since then. Now watches both new paths (old ones kept as harmless fallback).
- New `docs/backlog/token-migration-tracker.md` — alphabetical Done/Needs-rewrite/Missing status for every built component's token folder, cross-referencing `packages/react/src/components/core/*` against `packages/primitives/src/tokens/components/*`. Includes a re-runnable classification command (grep-based, checks actual file content — extension alone isn't reliable evidence of DTCG compliance, several `.json5` files still had old-format content).

**Why:**
- Started from a single tooltip fix; found "components can't use base tokens directly" was being routinely violated because the functional layer itself had broken/nonexistent alias paths, forcing components to reach through to base or to stale pre-refactor `color.*` paths. Fixing the functional layer first (this session) unblocks component-by-component fixes (tracked in the new tracker doc) without repeating the same base-token-reachthrough pattern in each one.

**Next agent:**
- `docs/backlog/token-migration-tracker.md` is the punch list — 4 components done, 15 need rewrite, 6 have no token folder at all, 1 (`input/`) is orphaned (no matching component, unclear if dead or pre-scaffolded).
- Open gaps flagged with `$description: 'GAP: ...'` rather than invented: `syntax.json5` has 3 raw hex colors per language with no matching base color (dark navy, teal/cyan, magenta/pink); `functional/size/z-index.json5`'s `popover/tooltip/toast` need `base.zIndex.700/800/900` (base scale currently stops at 600).
- `borderColor.informational` only has `subtle`/`strong` (2 steps), not the full 3-step shape `bgColor`/`fgColor` now have — `icon-button/outlined.json5`'s selected-border state currently can't vary across rest/hover/pressed because of this gap.
- `border.json5`'s `boxShadow.thin/thick/thicker` (should these be shadow tokens, or does this belong somewhere else structurally?) and Tooltip's `boxShadow` placement (effect vs. sizes) are still open structural questions, not resolved this session.
- `pill/*.json` (12 files, all old-format) look machine-generated by `scripts/generate-pill-shade-tokens.mjs` — fix the generator, not the 11 per-color output files by hand, once scoped.
- `button/*` has no shared `size.json5` at all (unlike `icon-button`) — needs one added if Button ever needs size variants.
- Component-level file-structure questions (one file per color variant vs. nested-in-one-file; where shared size/shadow live relative to color variants) were being actively worked out live in the IDE by the user during this session — check current on-disk state before assuming any pattern described in earlier commit messages is still current.

## 2026-09-12 — Phase 0: scaffold Style Dictionary + Zod, inert

**Changed:**
- `packages/primitives/package.json` — added real dependencies `style-dictionary@5.5.3` and `zod@4.6.3` (versions confirmed to match what `docs/token-architecture-migration.md` verified against Primer's own tooling).
- `packages/primitives/src/style-dictionary/cuboidStyleDictionary.mjs` — new, a real `StyleDictionary` instance registering two transforms (`cuboid/dimension/rem`, matching `build-theme.mjs`'s existing `pxStringToRem` px→rem formula exactly; `cuboid/name/kebab`, matching `build-theme-css.mjs`'s existing `emitNestedStringVars` naming). Confirmed it constructs and loads without touching any real token file.
- `packages/primitives/src/schemas/tokenLeaf.mjs` — new, two Zod schemas (`TokenLeafSchema`, `TokenReferenceSchema`) validating cuboid's *current* token leaf shape (`{"value": ...}`, pre-DTCG) — deliberately not the future DTCG `$value`/`$type` shape, since format adoption is a separate, later decision from porting today's inline validation checks to schemas. Verified against real token data from `tokens/base/light.json`.

**Why:**
- Executes Phase 0 of `docs/token-architecture-migration.md`: get the new tooling installed and the scaffolding in place with proven zero behavior change, before Phase 1 attempts the real byte-diffed migration of the build pipeline onto it.

**Next agent:**
- Nothing in the real build (`tokens:theme`) calls either new file yet — both are inert by design. Full `npm run build` verified byte-identical to Phase -1's baseline (same five generated files, same bundle sizes); `npm run test -w @sragatiping/cuboid-primitives` (including the `check-no-react` guard) passes clean.
- Phase 1 (point the preset at the real `tokens/` tree, build to a parallel output path, byte-diff against current output, port the 159 inline `build-theme.mjs` checks to real Zod schemas) is the next real step — expected to be the highest-effort phase per the migration doc, since cuboid's real token shapes will likely surface gaps the schema/preset above don't yet anticipate (only 2 of Style Dictionary's transforms and 2 of many possible schemas exist so far, intentionally minimal).

## 2026-09-12 — Phase -1: split into `packages/primitives` + `packages/react` npm workspaces

**Changed:**
- Repo root reorganized into npm workspaces (`"workspaces": ["packages/*"]` in root `package.json`, now a private orchestrator with no code of its own).
- `tokens/` and the token-build scripts (`build-theme.mjs`, `build-theme-css.mjs`, `build-component-theme-css.mjs`, `build-typography-theme.mjs`, `flatten-functional-*.mjs`, `generate-pill-shade-tokens.mjs`, `scripts/lib/spaceScale.mjs`) moved via `git mv` into new package `packages/primitives/` (`@sragatiping/cuboid-primitives`, private, not published standalone). Its `package.json` has no `react`/`react-dom` in any dependency field.
- `src/`, `tsconfig.json`, `vite.config.ts`, `.storybook/` moved via `git mv` into new package `packages/react/`, which keeps the public package name `@sragatiping/cuboid` and now depends on `@sragatiping/cuboid-primitives` as an ordinary workspace dependency (npm doesn't support the `workspace:` protocol — used `"*"`, resolved via npm's workspace auto-linking).
- Icon-related scripts (`extract-figma-icons.mjs`, `sync-icons.mjs`, `check-icon-imports.mjs`, `generate-icon-names.mjs`, `parse-figma-metadata-xml.mjs`, `figma-icons.metadata.xml`, `scripts/lib/icon-naming.mjs`) went to `packages/react/scripts/`, not `packages/primitives/` — they read/write `src/icons/`, which is React-side content, not tokens. The migration doc (`docs/token-architecture-migration.md`) didn't call this distinction out explicitly.
- The three token-build scripts that write generated output were repointed to cross the new workspace boundary on purpose: they still read `tokens/` from their own package root, but now write `src/theme/output/*` into `packages/react/`'s tree (added a `REACT_PKG_ROOT` constant in each rather than assuming input/output share a root).
- Added `packages/primitives/scripts/check-no-react.mjs` (wired into `npm run test -w @sragatiping/cuboid-primitives`), a grep-based guard that fails if any file under `packages/primitives` imports `react`/`react-dom`.
- Removed stale gitignored `dist/` and `storybook-static/` from the old repo root (both now build inside `packages/react/`).

**Why:**
- Executes Phase -1 of `docs/token-architecture-migration.md` and the boundary called for in `docs/dimension-b2-architecture.md` §3: primitives (token values) must be structurally incapable of depending on rendering concerns, so future styling/framework changes never have to renegotiate what a token is.
- **Real deviation from the migration doc, worth flagging explicitly:** the doc's stated Phase -1 exit criterion — "a stray `import React` inside `packages/primitives/scripts/` fails the install/build for that workspace" — does not actually hold under plain npm workspaces. npm hoists all dependencies into one root `node_modules/`, and Node's module resolution walks upward through parent directories regardless of what a package's own `package.json` declares, so `react` (installed for `packages/react`'s sake) is still resolvable from inside `packages/primitives` at runtime. Verified this concretely: added a stray `import React from "react"` to `build-theme.mjs`, ran it directly, it executed successfully. A true install-time wall would require pnpm (strict, non-hoisted `node_modules` by default) or npm's `nohoist`-equivalent config, neither of which this phase adopted. Added the `check-no-react.mjs` grep guard as the practical substitute — same practical effect (a violation is caught, just at test-time instead of install-time), no new tooling dependency.

**Next agent:**
- All five generated token outputs (`theme.json`, `token-output.json`, `base.json`, `theme.css`, `components.css`) verified byte-identical to pre-split output via a clean-slate rebuild + diff. Full `npm run build`, `npm run type-check`, and `npm run build-storybook` all pass.
- Nothing committed yet as of this entry — working tree has ~249 clean `git mv` renames plus 3 new files (`packages/primitives/package.json`, `packages/react/package.json`, `packages/primitives/scripts/check-no-react.mjs`), staged for review.
- The two pre-existing `THREADS.md` items (Stack/Box scale-token widening; unmigrated `sizes.space[N]` usage in JsonGraph/Graph) moved along with `src/` into `packages/react/` unchanged — this phase did not touch either.
- Style Dictionary migration (Phase 0 onward in `docs/token-architecture-migration.md`) is still not started; `packages/primitives/scripts/build-theme.mjs` and friends are unchanged hand-rolled JS, just relocated.
- The behavior-library seam (`docs/dimension-b2-architecture.md` §4.2, resolving D-5: React Aria vs. Radix) remains an open, unscheduled decision — deliberately not addressed this session per explicit user direction to defer it until a composed component actually needs it.

## 2026-09-07 — ActionMenu: add `autoFocusFirstItem` opt-out for combobox triggers

**Changed:**
- `src/components/core/ActionMenu/ActionMenu.tsx` — new `autoFocusFirstItem?: boolean` prop, default `true` (unchanged behavior for every existing caller). When `false`, the menu's mount-time `useLayoutEffect` that focuses the first/checked menu item is skipped entirely.

**Why:**
- Driven by a portfolio bug (its `BlockTypeAutocomplete`, the `<` block-type search menu): `ActionMenu` is built for the "click a button, menu opens, arrow through items" pattern and always steals focus into the menu on open. Portfolio needs the opposite — a combobox/typeahead trigger (a contentEditable field) that must keep focus and keep receiving every keystroke while the menu is a passive, read-only suggestions overlay. The synchronous `useLayoutEffect` focus-steal was winning a race against the field's own refocus effect, causing typed characters to land on a menu-item button instead of the field. Approved with the portfolio user as a small, reusable, non-breaking addition rather than a portfolio-side workaround.
- **Next agent:** caller (portfolio's `BlockTypeAutocomplete`) already implements its own keyboard nav independent of `ActionMenu`'s internal `handleMenuListKeyDown` (which relies on `document.activeElement` being inside the menu), so this opt-out doesn't break arrow-key navigation for that caller. No test file exists for `ActionMenu` itself (Storybook only) — none added.

## 2026-08-24 — Add sortable component roadmap story

**Changed:**
- `src/components/core/Table/Table.tsx` — added opt-in TanStack sorting to `SimpleTable`, with controlled/uncontrolled sorting state, accessible `aria-sort`, and icon-backed sort buttons.
- `src/components/core/Table/ComponentRoadmap.stories.tsx` — added a four-table roadmap covering Shipped, Backlog, Feature Upgrade, and Bugs; every table is sortable.
- `docs/backlog/core-components.md` — recorded sorting as the first shipped slice of the broader Table & Grid upgrade.

**Why:**
- Establishes a maintained Storybook view of Cuboid implementation status before the remaining component backlog is built.

**Next agent:**
- The Table & Grid cell-type system, pagination, row actions, and remaining Figma states are still open work.

## 2026-08-24 — Track IconButton tooltip-label enforcement

**Changed:**
- Added an open Bugs roadmap row for requiring tooltip labels on `IconButton` instances.

**Why:**
- Icon-only actions should expose a discoverable label consistently; the current `tooltip` prop remains optional pending the enforcement change.

**Next agent:**
- Decide whether enforcement should be compile-time (`tooltip` required), runtime, lint-based, or limited to a documented accessibility rule.

## 2026-08-08 — Pill: per-instance padding/borderRadius/borderColor/borderWidth overrides

**Changed:**
- `src/components/core/Pill/Pill.tsx` — new optional props:
  - `paddingInline`, `paddingBlock` (`SpaceToken`, e.g. `"0.5x"`)
  - `borderRadius` (named `sizes.borderRadius` stop or `SpaceToken`)
  - `borderColor` (`GlobalColorPath` dot-path or raw CSS color, e.g. `"error.default"` or `"#ff6b6b"`) — applied as a direct `border-color` style property, so it wins over both the `[data-cube-pill]` shade/intensity rule and `.cube-Pill--themed` regardless of which is active. Works even on a `border={false}` (filled) pill, since filled surfaces already carry a transparent border color underneath.
  - `borderWidth` (named `sizes.borderWidth` stop `"thin"`/`"thick"`, or a raw CSS length)
  - All default to `sizes.pill.*` / the shade recipe when unset — no behavior change for existing usage.
- Added `LayoutOverrides` and `BorderOverrides` stories to `Pill.stories.tsx`; updated docs text.

**Why:**
- Previously the only way to change a single pill's padding/radius/border was the heavyweight `theme={{ sizes: { pill: {...} } }}` full-recipe override, or an undocumented raw `style={{ "--cube-pill-paddingInline": ... }}` CSS-var hack. Neither is a clean per-instance escape hatch. `spaceScale` was established today as the universal path for this kind of override on `Stack`/`Box`; `Pill` needed the same, but since Pill isn't `Stack`/`Box`-derived (fixed-recipe chip, not a layout primitive), it needed its own prop wiring rather than inheriting it.

**Fixed along the way:**
- Found and avoided a real bug while wiring this up: `.cube-Pill--themed` in `Pill.module.css` controls **color only** (not layout — `--cube-pill-*` layout vars are read unconditionally by the base `.cube-Pill` rule). My first pass gated the new layout props on that class, which would have incorrectly applied themed colors to a pill that only wanted a padding/radius tweak. Fixed by keeping `--themed` tied strictly to the `theme` prop, and computing layout-override vars independently of it.
- Caught a wrong story example before it shipped: `"border.red.2"` doesn't exist in `globalColors.border` (only `gray`/`grayAlpha` do) — would have silently no-opped as an invalid raw CSS string. Verified the real path (`"error.default"`) against `theme.json` before using it in the story.

**Next agent:**
- `npx tsc --noEmit`, `vitest run` (same one pre-existing unrelated failure), and `npm run build` all clean.
- No dedicated Pill test file exists (pre-existing gap, not introduced here) — only Storybook coverage.
- `border-width` on `.cube-Pill` now reads `var(--cube-pill-borderWidth, var(--cube-sizes-borderWidth-thin))` — a Pill-specific var with the global one as fallback, so this doesn't affect border width on any other component.

## 2026-08-08 — Stack inset/top/right/bottom/left accept spaceScale tokens too

**Changed:**
- `src/components/core/Stack/Stack.tsx` — `StackInset` (backing `inset`, `insetBlock`, `insetInline`, `top`, `right`, `bottom`, `left`) widened from `StackPadding | 0` to `StackPaddingValue | 0`, so these positioning props now accept `spaceScale` tokens (`"0.25x"`) the same way `padding`/`gap` did as of the earlier entry today.

**Why:**
- These props already resolved through `insetToCss` → `paddingToCss`, which already handled scale tokens from the earlier padding/gap change — only the TypeScript type hadn't caught up, so `spaceScale` values were rejected at compile time even though the runtime path was already correct. Closing this makes `spaceScale` the consistent, universal escape hatch across every `Stack`/`Box` sizing-shaped prop (padding, gap, inset, margin) — not padding/gap only.

**Next agent:**
- `JsonGraph`/`GraphCard` still use raw `tokens.sizes.space[N]` directly (not migrated) — see `THREADS.md`, deferred intentionally, not an oversight.
- `borderRadius` (`BoxBorderRadius`, its own closed scale) was NOT widened — out of scope for this change, would need its own decision since it isn't derived from `space.json`.
- `npx tsc --noEmit` clean; `vitest run` clean (same one pre-existing unrelated failure as before).

## 2026-08-08 — Remove duplicated typography token intermediate

**Changed:**
- `scripts/build-typography-theme.mjs` — no longer writes `tokens/functional/typography/theme.tokens.json`. Its transform is now exported as `buildTypographyTheme(raw)`; the CLI entry (`node scripts/build-typography-theme.mjs`) prints the same JSON to stdout instead, for inspection.
- `scripts/build-theme.mjs` — imports `buildTypographyTheme` directly and calls it in-memory instead of reading the generated file from disk.
- Deleted `tokens/functional/typography/theme.tokens.json` and its `.gitignore` entry (never written again, so nothing to ignore).
- `package.json` — dropped `pretokens:theme` (no pre-step needed now; `build-theme.mjs` computes typography itself). Kept `tokens:typography-theme` as a standalone inspection command.

**Why:**
- `theme.tokens.json` was a full duplicate of `typography.json`'s data (same values, just still `{value}`-wrapped) sitting inside `tokens/`, which is otherwise 100% hand-authored source — every other `tokens/functional/*` subfolder has exactly one file. It existed only as a file-based handoff between two build scripts; nothing else read it. `npm`'s `pretokens:theme` lifecycle hook regenerated it on every `tokens:theme` run, which is what made it look like recurring, unexplained output in a source folder.

**Next agent:**
- Verified: `npm run tokens:theme` output (`src/theme/output/theme.json`) is byte-identical before/after this refactor. Full `vitest run` and `tsc --noEmit` both clean (one pre-existing, unrelated failure in `build-theme-css.test.mjs`).

## 2026-08-08 — Stack/Box padding & gap accept 8pt scale tokens

**Changed:**
- `src/components/core/Stack/Stack.tsx` — `padding`, `paddingBlock`, `paddingInline`, and `gap` now accept a raw `SpaceToken` (`"0.25x"`, `"0.5x"`, `"1x"`, …) in addition to the existing named stops (`"xxs"`, `"sm"`, `"md"`, …). Scale-token values resolve via `spaceTokenToCssVar()` straight to `var(--cube-space-*px)`, bypassing the CSS-module class path (which only exists per named stop). Named-stop usage is unchanged — this is additive.

**Why:**
- The portfolio hit a case (`ListTreeNumbered`/`EditableField` empty-block chrome) needing exactly 2px of padding — a legitimate 8pt-grid value with no named stop between `xxs` (4px) and nothing. `Box`'s margin props already supported the full `SpaceScale` via `spaceTokenToCssVar`; `Stack`'s padding/gap never got the same treatment. This closes that gap using the existing, already-wired conversion utilities (`utils/spaceToken.ts`, `utils/spaceScale.ts`) — no new pattern invented.

**Next agent:**
- Uncommitted in this repo as of this entry. Not yet linked/published into the portfolio (portfolio still on cuboid@0.1.7, a real installed copy, not a symlink) — see `THREADS.md`.
- `npx tsc --noEmit` clean; full `vitest run` passes (one pre-existing unrelated failure in `scripts/__tests__/build-theme-css.test.mjs`, confirmed present on a clean checkout too).
