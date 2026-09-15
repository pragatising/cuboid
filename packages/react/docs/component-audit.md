# Component audit

Tracks missing or broken *component API surface* found while working through the token migration — props, states, or behaviors a component is missing that make it hard to use correctly in practice, as opposed to token-layer correctness (tracked separately in `docs/backlog/token-migration-tracker.md` at the repo root).

A finding here means: the component's actual `.tsx`/`.module.css` is missing something, not that its tokens are wrong. Fixing a finding usually means touching the React component itself (new prop, new CSS var, new class), possibly alongside adding the matching token.

## How to use this doc

- One entry per component. Add a component's section the first time a gap is found in it; don't wait for a full audit pass.
- Each finding: what's missing, how it was discovered, and the practical consequence of not having it.
- Mark a finding `Fixed` (with date) rather than deleting it once resolved — keeps a record of what changed and why.
- This is expected to grow as more components go through the token-migration pass — most components in `token-migration-tracker.md`'s "Needs rewrite" list haven't been checked against their actual `.tsx` yet.

---

## Container

**Missing: `paddingBlock` prop.**
- `Container.tsx` has `paddingInline?: StackPadding | false` (defaults to `layout.pagePaddingInline`) but no equivalent vertical padding prop — no `paddingBlock`, no `--container-paddingBlock` CSS var, nothing in `Container.module.css` sets block padding at all.
- Discovered: while building `container.json5` token file — the component only exposes `maxWidth`/`paddingInline`/`minHeight` as themeable surface, so the token file initially mirrored that (incompletely).
- Consequence: any page needing vertical breathing room inside `Container` has to add it externally (wrapping `Stack`, ad-hoc `style`, etc.) instead of through the component's own API — inconsistent with how `paddingInline` already works. For a "page shell" component, lacking vertical padding is a real practical gap, not a stylistic choice.
- Status: **Open.** Needs `paddingBlock?: StackPadding | false` prop added to `Container.tsx` (mirroring `paddingInline`'s implementation exactly — same `StackPadding | false` type, same CSS-var wiring), a `container.paddingBlock` token added to `container.json5`, and `--container-paddingBlock` consumed in `Container.module.css`.

---

## (next component reviewed goes here)
