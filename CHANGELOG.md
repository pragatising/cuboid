# Changelog

Rolling session log for Claude Code continuity. Newest entry on top. Each entry: what changed, why, and anything the next agent needs to know. Keep entries short — skip anything derivable from `git log` or the diff itself.

<!--
Template for a new entry:

## YYYY-MM-DD — Short title

**Changed:** one or two lines, files/areas touched.
**Why:** the actual motivation, not just "fixed bug."
**Next agent:** open threads, deferred decisions, known debt, or nothing if clean.
-->

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
