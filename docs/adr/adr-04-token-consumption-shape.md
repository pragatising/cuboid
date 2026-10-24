# ADR-04: How a component consumes a token's value

**Status:** Approved, Adopted — primitives-side built 2026-10-07
**Decided:** 2026-10-07

## As built (2026-10-07)

- `src/platforms/typescript.ts` / `javascript.ts` wired into `scripts/buildTokens.ts`, emitting
  `dist/js/tokens.js` (ESM, `export default {...}`) and `dist/cjs/tokens.js` (CommonJS) — both fully
  resolved values, verified leaf-count-identical to `dist/tokens.json` (1,138 leaves). Fixed a real bug
  surfaced only by actually running the build: both platforms threw under this build's
  `warnings: "error"` gate on a name collision (no name transform registered, so e.g. two unrelated
  tokens both named `height` collide) — downgraded to `"warn"`, matching the existing precedent already
  in `json.ts` for the identical, harmless case.
- `package.json` exports `./tokens.js` (→ `dist/js/tokens.js`) and `./applyOverrides` (→
  `src/applyOverrides.ts`, shipped directly from source — no compile step exists in this package for
  hand-written runtime utilities; `tsconfig.json` is `emitDeclarationOnly`, so there's nowhere a compiled
  `.js` could come from today).
- `src/applyOverrides.ts` — the runtime re-theming mechanism. Plain recursive merge: nested plain objects
  merge key-by-key; arrays and primitives replace wholesale (deliberate — index-merging a shadow token's
  layer array would silently mix one override's color with another's offset). Zero dependencies, not
  wired to Style Dictionary or React in any way.
- Tests: `src/platforms/jsOutput.test.ts` (end-to-end build into a temp dir, reads real emitted files),
  `src/exportsContract.test.ts` (the public `exports` map resolves to real files), `src/applyOverrides.test.ts`
  (merge semantics, including the array-replace rule and a full-theme-override case). 70+ tests passing.
- **Not yet done:** retiring `packages/react/src/theme/{ThemeContext.tsx, defaultTheme.ts, tokenOutput.ts,
  themeCubeOverride.ts}` (the superseded context-based seam) — deferred to the React-refactor phase per
  standing user direction (primitives must be tight first).

## Amendment (2026-10-19): build-time overrides, runtime modes via a store + hook

Two requirements surfaced after the original decision, and together they replace parts of it:

1. **Overrides must cascade.** A consumer changing a base or functional token has to flow into every token that references it. Merging overrides into the already-resolved object (the original `applyOverrides`) cannot do that.
2. **Light/dark are modes, not themes, and must switch while the app is live, with no rebuild.**

What changes:

- **Overrides run through the pipeline, at the consumer's build.** The consumer supplies a partial DTCG file (any layer: base, functional, component; `.json`/`.json5` or a `.ts` default export). `build({ overrides })` deep-merges it over the token dictionary in the `consumerOverrides` preprocessor, *before* references resolve, so a base change cascades. It is a preprocessor and **not** an extra Style Dictionary `source` file because SD's source merge replaces a whole token on a same-path collision — an override of only `$value` would silently drop the token's `$type`, `$extensions` (including its dark value) and `alpha`. Overrides may only target existing tokens (an unknown path is a typo and fails the build). The merged tree is then validated with the Zod `designToken` schema, and a broken `{reference}` throws. `applyOverrides` is reused as the merge, but no longer as a consumer-facing runtime API.
- **The build emits one resolved tree per mode**, by running the existing `themeOverrides` preprocessor once per mode (`light`, `dark`): `tokens.light`, `tokens.dark`, same shape, plus the generated `.d.ts`. Modes are authored inline on the token (`$extensions['org.cuboid.overrides'].dark`), per DESIGN.md §5.
- **Components read the current mode's tree through a hook backed by a tiny store**, not CSS vars and not a React context provider: `const tokens = useTokens()`. The store holds the active mode; `useTokens()` is `useSyncExternalStore` over it; `setMode("dark")` notifies subscribers. Only a mode change re-renders token readers (rare, user-initiated) — theme *values* never change at runtime, so the original objection (re-render on every theme change) is bounded to the toggle. The store lives in `packages/react`; `packages/primitives` stays React-free.
- **Delivery to the published components is unchanged from the earlier amendment:** `@sragatiping/cuboid-primitives` is an **external** import of `@sragatiping/cuboid` (`packages/react/vite.config.ts`) and must be published. The consumer's build resolves it to the trees generated from their overrides; with no overrides, to the defaults we ship. How that resolution is wired (alias first, bundler plugin later) and the consumer CLI are still open.
- **Import shape:** default import with generated types (`dist/js/tokens.d.ts`).

Costs accepted: a hook in every token-reading component; SSR needs the initial mode known at render (cookie or `prefers-color-scheme`) to avoid a wrong-mode flash; modes beyond light/dark are supported by the same mechanism but are not authored yet. Rejected for this: CSS variables (live switching with zero JS, but contradicts the static-values goal) and `light-dark()` strings (colors only, two modes only).

## Decision

A component reads a token's **resolved raw value** (`"#1a7f37"`, `"0.5rem"`) from a **statically-imported JSON/JS object**, not a CSS custom property and not a value read from React context. Re-theming is a **plain-object merge, applied once, before render** — never a context subscription that causes every token-reading component to re-render when a theme changes.

```ts
// what the pipeline emits (already resolved — no {references}, no var())
// packages/primitives/dist/js/tokens.js
export const tokens = {
  button: { primary: { bgColor: "#1a7f37", fgColor: "#ffffff" }, danger: { bgColor: "#cf222e", fgColor: "#ffffff" } },
  card: { bgColor: "#fafafa", borderRadius: "0.5rem", borderColor: "#eaeaea" },
};
```

```tsx
// what a component does with it — no hook, no context, no CSS var
import { tokens } from "@sragatiping/cuboid-primitives";

function Card({ children }) {
  return (
    <div style={{ background: tokens.card.bgColor, borderRadius: tokens.card.borderRadius }}>
      {children}
    </div>
  );
}
```

```ts
// how a consuming app changes a value — called once, at app boot (or on an explicit toggle), never from inside a component
import { tokens } from "@sragatiping/cuboid-primitives";
import { applyOverrides } from "@sragatiping/cuboid-primitives";

export const theme = applyOverrides(tokens, {
  card: { bgColor: "#1a1a1a" },
  button: { danger: { bgColor: "#ff4444" } },
});
```

A component that wants to be override-aware imports `theme` (the app's merged object) instead of `tokens` (the raw package export) — a plain module swap, decided by whichever object the app's own entry point re-exports. No provider tree, no `useTheme()` call in any component.

## What this rules out, and why

Four real candidate shapes were compared concretely (component code written out for a Card and a Text-in-Box-with-Icon under each) before this was decided:

1. **Raw `var(--cube-...)` strings at every call site.** No autocomplete, no typo safety — a renamed token breaks every consumer silently, caught visually, not by the compiler. Rejected on DX grounds alone.
2. **A typed JS object whose *values are `var()` reference strings*** (the Panda CSS `token.var()` / Vanilla Extract `vars` pattern — real, named, widely used in design-token tooling). Still requires spelling out the full token path at every call site (`t.bgColor.neutral.light[1]`) — solves the typo problem, not the verbosity problem. Rejected: the autocomplete win doesn't justify the ceremony: every component ends up importing `tokens` and hand-walking a path, which is exactly as tedious as the context version below, just without the re-render cost.
3. **A deep JS value object read from React context via `useTheme()`, deep-merged per theme/override** — GitHub's own prior design for this exact problem (`@primer/styled-react`), **which GitHub is actively retiring**, citing bundle size, SSR/hydration cost, and the re-render-on-every-theme-change cost as the reasons (`primer/react` discussion #7086). Rejected outright — adopting this is adopting a pattern its own authors walked away from, for reasons that apply identically here.
4. **CSS vars as the source of truth, JS as a thin `setTheme()`/`setProperty()` control surface over them** (Primer's actual current, non-deprecated model) — rejected not on technical merit (it's the cheapest at runtime, and the right call for a design system consumed by one team that controls every call site) but because it doesn't fit cuboid's stated goal: **cuboid is a library for other developers to build arbitrary apps on, and several of this session's examples confirmed those developers do not want to hand-write `var(--cube-bgColor-neutral-light-1)` or a CSS Module for every component they build.** A prior production experience (cited directly in this session, not Primer's) of a resolved-JSON output consumed directly with no CSS lookup at all is the shape this ADR is built from.

**What survives and is adopted:** shape 4's underlying value — components reading something **statically resolved**, not dynamically recomputed — combined with the resolved-values-not-references approach from the real prior experience cited above. This is closest to candidate 4 minus the CSS-var indirection: still static, still zero-context, still no re-render cascade, but the static thing being read is a plain resolved object, not a CSS custom property.

## What "runtime re-theming" means here, precisely — because the term was being used loosely

**Not supported, and not a goal:** flipping a theme live, in an already-rendered page, with the DOM repainting on its own with no React involvement (what CSS-variable-swap gives Primer for free, because the browser's cascade does the work, not JS).

**Supported, and the actual goal:** an app can supply override values that produce a **different resolved object**, decided **before** that object is used to render anything — equivalent to picking a theme at build time or at app-boot time, not mid-session with no re-render at all. If a consuming app later wants a live, no-reload toggle on top of this, that app does its own re-render pass with a different merged object (e.g. hold the result of `applyOverrides` in one piece of state, swap it on click) — that's a cost the *consuming app* opts into deliberately, not a mechanism cuboid's own components carry by default.

## Concrete implications — what has to be built

1. **Pipeline must emit resolved JS/TS, not just CSS + flat JSON.** `packages/primitives/src/platforms/javascript.ts` and `typescript.ts` already exist, already emit fully-resolved values (not var-refs — confirmed by reading them: transforms list is `color/hex`, `dimension/rem`, etc., the same resolving transforms the CSS platform uses) and already run the `themeOverrides` preprocessor. **They are defined but never passed into `scripts/buildTokens.ts`'s `platforms: {}` object** — the gap is wiring, not new transform/format logic.
2. **`applyOverrides()` needs to be written** — a plain recursive-merge utility (partial object → base object → merged object), with no dependency on React, context, or any component. Lives in `packages/primitives`, exported alongside `tokens`.
3. **`packages/react`'s existing `ThemeContext.tsx` (37 lines), `defaultTheme.ts` (105 lines), `tokenOutput.ts` (9 lines), `themeCubeOverride.ts` (82 lines) are superseded by this decision** — these implement exactly candidate 3 (context-based, partial-deep-merge `ThemeProvider`), which this ADR rejects. `DESIGN.md` §4 (written 2026-09-25, before this ADR) explicitly states this context seam is "actively used" by a real external consumer (a portfolio app, ~60 import sites) and says it "must NOT be dropped." **This ADR formally overrides that constraint** — the portfolio app's usage is a required migration, not a blocker to building the new model. Track it as follow-up work once the new shape ships, not as a reason to keep the old one.
4. **Components change what they import, not how they're structured.** A component currently reading `var(--cube-button-primary-bgColor-rest)` from its own `.module.css`, or (post-refactor-plan) a future one reading `useTheme().button.primary.bgColor`, instead imports `tokens` (or the app's `theme` re-export) and reads `tokens.button.primary.bgColor` directly in a `style` object or equivalent. This is a real, load-bearing decision for every component built from here forward — not swappable casually later without touching every call site again.
5. **CSS output (`dist/css/theme.css`) is kept, unchanged, for a different audience.** Non-React consumers (plain HTML/CSS, other frameworks) still get `var(--cube-*)` custom properties and can re-theme the CSS-native way (override the variable under their own selector). The two outputs serve two different consumption models side by side — this ADR does not remove or deprecate the CSS platform, only decides what *cuboid's own React layer* reads.

## What this is not deciding

- The exact prop names/vocabulary components expose (`bg` vs `background` vs `backgroundColor`, scale-prop vs explicit-value props) — explicitly out of scope for this ADR, to be decided per-component later.
- Whether a future live (no-reload) theme toggle gets built into `packages/react` itself, versus left as something a consuming app assembles on its own with `applyOverrides` plus its own state. Not needed now; revisit if asked for.
- The Zod-schema validation gate (`primitives-pipeline-tracker.md`'s next real gate) — orthogonal to this decision.

## Source

This session's own research (not external citation-worthy ADRs): live inspection of `primer/react` and `primer/primitives` source via `gh api`/raw GitHub fetches (confirmed zero JS-token imports in real Primer components, confirmed `@primer/styled-react`'s deprecation and its own README's stated reason), confirmed `panda-css.com`/`vanilla-extract.style` docs for the `token.var()` / `vars` pattern, and a producthistory data point supplied directly by the person making this decision (prior experience with a resolved-JSON, no-CSS-lookup component library). Existing `packages/primitives/src/platforms/{javascript,typescript}.ts` read directly to confirm they already emit resolved (not reference) values.

## Amendment (2026-10-22): component CSS may read the published token variables; the typed JS tree stays the consumer API

**Why.** The original shape kept CSS variables out of components entirely. For *state* colours that cost an unusual workaround:
a `:hover` rule cannot take an inline style, so every Button/IconButton copied all of its state colours onto the element as
element-scoped variables (`--button-bg-hover`, …) — about 50 inline entries per button. Primer, Atlassian and the Claude
design system do the opposite: the tokens are CSS variables defined once for the page, and the component CSS only reads them.

**What changes (internal to the library).**

- The token build's `dist/css/theme.css` now carries every mode: the first (light) on `:root`, each other mode under
  `[data-mode="<mode>"]`, the full variable set in each (a variable that references another is resolved where it is defined,
  so a dark *subtree* only flips if the dependent variables are redefined inside it).
- `setMode()` also sets `data-mode` on `<html>`, which is what switches component CSS. The JS store and `useTokens()` are unchanged.
- A component's `.module.css` may read `var(--cube-*)` for its colours, sizes and states, picking the look by `data-variant`,
  `data-size` and similar attributes. The element then carries no inline style. Piloted on Button and IconButton.
- A test per converted component fails if its CSS reads a variable missing from the built `theme.css`, and checks that the
  variables it maps resolve (in both modes) to the same values as the JS tree.

**What does not change.** Consumers still use the typed JS tree (`useTokens()`, `<Box backgroundColor="…">`, `variant`) and do not
write `var(--cube-…)` strings; the rejection of "raw `var()` strings at every call site" stands. Build-time overrides still
flow through the pipeline, now into the CSS as well as the JS.

**New requirement for an app.** It loads `@sragatiping/cuboid-primitives/css/theme.css` once (or its own token build's output, if it
overrides tokens), and a server render sets `data-mode` on `<html>` to avoid a wrong-mode flash. Runtime overrides applied in the
browser reach the JS tree, not these variables.


## Amendment (2026-10-24): the CSS-reads-variables shape is the default for state-heavy components; token-free components

**Why.** The 2026-10-22 amendment said the shape was "piloted on Button and IconButton". It has since been used for the ActionMenu family
(`ActionMenu`, `Popover` header and footer, `Sidebar` rows), the form-control chrome (`InputField`, `InputText`, `TextArea`, `Select`,
`Autocomplete`), `EmptyState` and `TileIcon`, and the element-scoped `actionMenuVars` helper was removed. It held up: every component
carries no inline token variable, the browser picks the state, and a test per stylesheet fails if it reads a variable the build does not
publish (checked in both modes). A real-Chrome sweep (axe with colour contrast on, light and dark, popups open) was clean on all of them.

**What changes.**

- For a component with states (hover, focus, disabled, error, selected), reading `var(--cube-<group>-…)` in its CSS module is the default,
  not a pilot. The element-scoped `--<component>-…` helper (`cssVars()` plus `actionMenuVars`-style functions) is retired for new work.
- **A component with no states and no design values of its own needs no token group.** `TileIcon` takes its fill and glyph colour as props;
  `EmptyState` reads the size scale (`--cube-size-*`, `--cube-borderRadius-*`) for spacing and uses `Text` for its type. Do not invent a
  token group only to have one.
- A text colour must pass 4.5:1 on the surface it sits on, in both modes. `packages/react/src/components/core/InputField/fieldContrast.test.ts`
  checks the form-control and menu text pairs; extend it when a component adds a text colour. A fix repoints the *semantic* token to a base
  step that passes (and, for a dark-only problem, uses an `org.cuboid.overrides` dark value); it never edits a shared base step.

**What does not change.** Consumers use the typed JS tree and props, not `var(--cube-…)`. A library component may pass a `var()` string
to a prop only when the value is its own (for example `ActionListItem`'s description colour); an app should not.
