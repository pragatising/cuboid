# Roadmap

One-page "where does cuboid stand" view across every workstream. This is a pointer document, not a tracker — it says what phase each area is in and which file has the real detail. Update the phase/status lines here when a workstream moves; keep the actual findings in the linked file, not duplicated here.

---

## Current phase

**Primitives first, React frozen.** Standing decision: `packages/react` stays intentionally unrefactored until the token/primitives layer is tight. Don't "fix" React components as drive-by work — that's a deliberate choice, not an oversight.

---

## 1. Token pipeline (build tooling)

**Status: Done.** `packages/primitives/scripts/buildTokens.ts` runs end-to-end — CSS (`dist/css/theme.css`), JSON (`dist/tokens.json`), ESM (`dist/js/tokens.js`), CommonJS (`dist/cjs/tokens.js`). All 27 Zod schemas wired into a standalone validator (`npm run validate:tokens`), decoupled from the build itself (matches Primer's own real pattern). 88+ tests passing.

Detail: `docs/backlog/primitives-pipeline-tracker.md`

## 2. Token content (per-component correctness)

**Status: Done.** Every component token folder is DTCG-format (`$value`/`$type`), functional-token-only (no stale base-layer reach-throughs). Re-audited 2026-10-07.

Detail: `docs/backlog/token-migration-tracker.md`

**Found 2026-10-19 while building Subtitle:** two component token files (`subtitle`, `inline-code-snippet`) had a `$value` plus child tokens; DTCG treats that as a leaf, so Style Dictionary silently dropped the children (the build still exited 0). Fixed, and `src/tokenStructure.test.ts` now fails on any recurrence.

**Open, low-urgency:** ~18 `$description: 'GAP: ...'` markers remain in source (mostly color-literal gaps with no matching base step). One has visible UI impact — `button`/`icon-button` disabled-state borders render identical to rest/hover instead of fainter.

## 3. Token consumption shape (how a component reads a token)

**Status: Decided and built (ADR-04).** Components read resolved values from a statically-imported module (`tokens.card.bgColor` → `"#fafafa"`) — never a CSS var, never React context. Re-theming is `applyOverrides(tokens, partialObject)`, called once, no hook, no provider. Deliberately rejects the GitHub `@primer/styled-react` context-object pattern (which Primer itself is retiring).

Detail: `docs/adr/adr-04-token-consumption-shape.md`

**Done 2026-10-21:** `packages/react/src/theme/` is deleted and no component in `packages/react/src` imports it (every core and data component reads `useTokens()`). **Still open:** a real external consumer (portfolio app, ~60 import sites) depends on the old seam and the old prop APIs (`theme` prop, `Stack`, `IconButton` children, …); migrating it is required follow-up, not optional cleanup.

## 4. Dark mode (modes, switched live at runtime)

**Status: First pass authored, needs design review.** Light/dark are modes, not themes: the build emits a resolved tree per mode (`tokens.light`, `tokens.dark`) and the app switches between them live via `setMode` (see ADR-04 amendment). Dark values come from: a generated, contrast-matched base palette (`packages/primitives/src/tokens/modes/dark/base-colors.json5`, regenerate with `scripts/generators/generate-dark-palette.mjs`), hand-authored base alpha/shadow values (`modes/dark/alpha.json5`), and inline `org.cuboid.overrides.dark` on the few functional/component tokens a palette swap can't fix (white-on-fill backgrounds, modal scrim, syntax and highlight literals). Contrast is locked in by `src/darkMode.test.ts`. Not yet reviewed by eye by a designer; Figma variable modes not synced.

Detail: `packages/primitives/docs/DESIGN.md` §5

## 5. React component layer

**Status: Frozen, pending the primitives work above landing (it has).** Two separate axes once this phase starts:

- **Component API gaps** (missing props/states found while token-migrating) — `packages/react/docs/component-audit.md`. Sparse so far; most components haven't been checked against their `.tsx` yet.
- **New component build-out** (Figma-designed, not yet built in React) — `docs/backlog/core-components.md` (large items, one section each). (`docs/backlog/complex-compoennts.md`, previously listed here, was a different project's misplaced doc — deleted 2026-10-08, not cuboid backlog.)

**Done 2026-10-21:** every existing component is off the old CSS-var/context token seam and on ADR-04's shape (see §3), and all 153 stories render (jsdom smoke test + real Chrome). Recipe: `packages/react/docs/token-consumption.md`; per-component status: `docs/backlog/react-migration-tracker.md`. **Left:** component tests for the data components (CodeBlock, JsonViewer, Graph, JsonGraph, ApiResponseViewer), Figma Code Connect, and the downstream consumer migration.

## 6. Figma sync (bidirectional)

**Status: Explicitly out of scope until a later phase.** Scoped in design, not started in build. Depends on the token pipeline (§1) having shipped, which it now has — this doc's own dependency note is satisfied, but starting the work itself is a separate decision, not implied by that.

Detail: `packages/primitives/docs/DESIGN.md` §6

---

## Where the real detail lives (don't duplicate it here)

| Area | File |
|---|---|
| Pipeline build status, file-by-file | `docs/backlog/primitives-pipeline-tracker.md` |
| Token content status, per component | `docs/backlog/token-migration-tracker.md` |
| Token consumption architecture decision | `docs/adr/adr-04-token-consumption-shape.md` |
| Token format/color/authoring-source decisions | `docs/adr/adr-01` through `adr-03` |
| Primitives design rationale, dark mode, Figma sync plan | `packages/primitives/docs/DESIGN.md` |
| React component API gaps found during migration | `packages/react/docs/component-audit.md` |
| New component build-out backlog (Figma → React) | `docs/backlog/core-components.md` |
| Session-by-session change log | `CHANGELOG.md` |
