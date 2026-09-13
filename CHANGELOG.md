# Changelog

Rolling session log for Claude Code continuity. Newest entry on top. Each entry: what changed, why, and anything the next agent needs to know. Keep entries short — skip anything derivable from `git log` or the diff itself.

<!--
Template for a new entry:

## YYYY-MM-DD — Short title

**Changed:** one or two lines, files/areas touched.
**Why:** the actual motivation, not just "fixed bug."
**Next agent:** open threads, deferred decisions, known debt, or nothing if clean.
-->

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
