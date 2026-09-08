# Changelog

Rolling session log for Claude Code continuity. Newest entry on top. Each entry: what changed, why, and anything the next agent needs to know. Keep entries short — skip anything derivable from `git log` or the diff itself.

<!--
Template for a new entry:

## YYYY-MM-DD — Short title

**Changed:** one or two lines, files/areas touched.
**Why:** the actual motivation, not just "fixed bug."
**Next agent:** open threads, deferred decisions, known debt, or nothing if clean.
-->

## 2026-09-07 — ActionMenu: add `autoFocusFirstItem` opt-out for combobox triggers

**Changed:**
- `src/components/core/ActionMenu/ActionMenu.tsx` — new `autoFocusFirstItem?: boolean` prop, default `true` (unchanged behavior for every existing caller). When `false`, the menu's mount-time `useLayoutEffect` that focuses the first/checked menu item is skipped entirely.

**Why:**
- Driven by a portfolio bug (its `BlockTypeAutocomplete`, the `<` block-type search menu): `ActionMenu` is built for the "click a button, menu opens, arrow through items" pattern and always steals focus into the menu on open. Portfolio needs the opposite — a combobox/typeahead trigger (a contentEditable field) that must keep focus and keep receiving every keystroke while the menu is a passive, read-only suggestions overlay. The synchronous `useLayoutEffect` focus-steal was winning a race against the field's own refocus effect, causing typed characters to land on a menu-item button instead of the field. Approved with the portfolio user as a small, reusable, non-breaking addition rather than a portfolio-side workaround. Attribution for whoever finds this uncommitted: this diff is from a separate portfolio-driven session, unrelated to the token-architecture work below.
- **Next agent:** caller (portfolio's `BlockTypeAutocomplete`) already implements its own keyboard nav independent of `ActionMenu`'s internal `handleMenuListKeyDown` (which relies on `document.activeElement` being inside the menu), so this opt-out doesn't break arrow-key navigation for that caller. No test file exists for `ActionMenu` itself (Storybook only) — none added.

## 2026-09-07 — Token architecture migration plan; note pending ActionMenu change

**Changed:**
- `docs/token-architecture-migration.md` (new) — written plan for migrating the token build onto Style Dictionary, modeled on a verified audit of Primer Primitives' real architecture (not secondhand notes — checked against the live repo and published npm tarball). Covers: Primer's actual source structure, build preset, all 9 real output formats, Zod schema validation, and — the key finding — inline per-token theme overrides rather than parallel diff-file trees. Documents cuboid's current gap (159 inline `console.error`/`process.exit` checks instead of a schema, zero theme/mode variant support) against Primer's approach, and a phased plan (Phase -1 through Phase 3) starting with splitting `packages/primitives` + `packages/react` as npm workspaces so token code has zero React dependency — enforced by `package.json`, not just convention — before the Style Dictionary work begins inside that boundary. Also scopes a separate, later effort: agent-driven bidirectional Figma sync (component generation + live variable sync), targeting one shared cuboid library file that other Figma files import the way code imports the npm package.

**Why:**
- A real bug this session (`CodeBlock`'s `fontWeight` silently resolving through a build script's private internal renaming instead of a real authored token) surfaced that `build-theme.mjs`'s validation is ad hoc, not systematic — this doc is the response, done as a written plan before any code changes per repo convention for changes this size.

**Next agent:**
- Nothing in this plan has been implemented yet — it's planning only. Phase -1 (workspace split) is the first real step whenever this is picked up.
- `src/components/core/ActionMenu/ActionMenu.tsx` has an uncommitted diff (adds an `autoFocusFirstItem` prop for combobox/typeahead triggers) that was **not made by this session** and has no context attached — I don't know its motivation or whether it's finished. Do not assume it's related to the token-architecture work above; investigate/attribute it before building on it or committing it.

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
