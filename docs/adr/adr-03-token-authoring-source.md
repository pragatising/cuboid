# ADR-03: Where a token's value comes from

**Status:** Approved, Adopted
**Decided:** 2026-09-13

## Decision

**Hand-authored JSON5 is the source of truth. Figma is a one-way mirror — tokens push into Figma via `$extensions`-driven sync; Figma variables are never pulled back into JSON.** Matches Primer's model (see below), not Spectrum's bidirectional model — both were real, evidenced precedents; this repo picked Primer's.

Concretely: a color's value is decided by editing `light.json5` (or the relevant functional/component token file), not by editing the variable in Figma. A real Cuboid Figma file already exists (`[ DS ] Cuboid`, fileKey `zOabpawUgebUI45IulHZUP`) with a `base` collection holding light/dark modes for these same colors — confirmed live via `get_variable_defs` this session, e.g. `colors/fg/neutral/default` → `#525252`. That file is the *target* of a future push, not a source to read from.

## What Primer actually does (verified, not the common assumption)

**The repo's JSON is the source of truth. Figma is a one-way mirror, imported into — not exported from.**

```
a human picks/tunes a color in Prism (primer.style/prism, perceptually-uniform editing tool)
        ↓ (manual — exact hand-off mechanism not documented anywhere found)
hex value hand-committed into src/tokens/**/*.json5  ← THE source of truth
        ↓ (Primer's own build script, one direction only)
scripts/buildFigma.ts → dist/figma/*.json (Figma-variable-shaped: RGBA float, collection, scopes)
        ↓
"Primer Design Token Manager" Figma plugin imports that file INTO Figma
```

There is **no** automated Figma→JSON generation step anywhere in Primer's real pipeline. A designer does not edit a Figma variable and have that flow into the repo automatically.

## Evidence

- `contributor-docs/design/color-scales.md:344` (primer-primitives-reference) — the only literal "source of truth" string found in either Primer repo, naming `src/tokens/base/color/light/light.json5` explicitly.
- `contributor-docs/adrs/adr-007-repo-structure.md` — the Figma output file "**is used with** the Primer Design Token Manager Plugin for Figma" (import direction, stated directly).
- `scripts/buildFigma.ts` (read in full) — reads source JSON5, writes `dist/figma/**/*.json`. No reverse path (Figma → JSON) exists in the script or anywhere in `.github/workflows/`.
- Primer's plugin listing itself could not be independently verified (Figma community page returned 403; no plugin source repo found). Its behavior is known only via what Primer's own scripts say they feed into it.
- Prism (`github.com/primer/prism`) is confirmed real and Primer-built, but its README does not document how a value gets from Prism into the JSON file — assumed manual, not verified.

## Why this matters for Cuboid

Cuboid's stated goal (raised 2026-09-13) was to avoid hand-authoring tokens in favor of "some automation to generate tokens" from Figma. **Primer is not evidence that this is solved or standard practice** — Primer hand-authors too; it just also *mirrors* the result into Figma afterward, for designers' benefit, not the other way around. Copying Primer's pipeline does not get Cuboid an automated Figma-in workflow — it gets the same hand-authoring Cuboid already has, plus a one-way push to Figma.

## Decision record — why Primer's model, not Spectrum's

Two real precedents pointed in different directions:

1. **Primer's model** (chosen): hand-author hex in JSON5 (ADR-02's format), one-way push to Figma. Simplest, lowest tooling investment, matches what Cuboid already does today.
2. **Spectrum's model** (not chosen, for now): neither side purely authoritative — `figma export` + `figma import`, reconciled via a read-only `diff` + human-reviewed `pair`, never auto-merged. Real and buildable (Cuboid's own MCP Figma tools — `get_variable_defs`, `use_figma` — proved this concretely this session), but meaningfully more tooling investment (four real tools, conflict handling) than a one-person, one-consumer system currently needs.

**Revisit this decision if**: a second person starts editing tokens, Figma becomes the natural place design decisions get made day-to-day (rather than code), or the manual JSON→Figma push becomes a real recurring chore worth automating properly. Until then, building Spectrum's four-tool reconciliation machinery would be solving a coordination problem that doesn't exist yet — the same over-building this repo's other ADRs (see `docs/dimension-b2-architecture.md`) already argue against.

## A second, more mature precedent: Adobe Spectrum (not Primer)

Directly relevant to the open decision above — Spectrum's own token-authoring RFC (`adobe/spectrum-design-data` discussion #625, fetched via `gh api graphql` this session, real comment thread through September 2026) independently confirms the instinct behind this whole research thread: **hand-typing JSON is explicitly named as the problem, not accepted practice.**

**Spectrum's stated starting problem** (their RFC's own words): *"Current token authoring is ad-hoc, lacks validation, has no review process, and creates coordination overhead between design and engineering."*

**Their fix is a web authoring tool, not a text editor.** A "Design Data Management App" is the primary authoring surface — a designer uses a UI, and the tool writes the JSON *for* them, as an authenticated pull request. Figma is explicitly demoted: *"Figma (Secondary, View-Only for Most)... NOT primary authoring environment (prevents validation issues)... Figma can't enforce schema, taxonomy, or validation rules."*

**Bidirectional Figma sync is real here — and shipped, per the newest comment (September 2026 update on the same discussion):**

| Tool | Direction | What it does |
|---|---|---|
| `figma export` | tokens → Figma | exports a platform's Figma variable collection from the resolved token dataset |
| `figma import` | Figma → tokens | turns a Figma variable edit into a `manifest.json` override/extension — **the reverse path Primer does not have** |
| `figma diff` | read-only, both sides | classifies every variable as `match` / `value-mismatch` / `figma-only` / `design-data-only` / `renamed` / `skipped` — surfaces every disagreement, resolves nothing automatically |
| `figma pair` | both sides | drafts `token-name ↔ figma-name` mapping candidates by matching resolved *values*, for human review — solves the "names don't match 1:1 across tools" problem |

**The key design insight this adds to the open decision**: bidirectional sync's real risk (raised earlier this session — "what if it's both ways, we need to figure out") is not solved by a merge rule (last-write-wins, etc.) — it's solved by making every disagreement **visible and reviewable** (`diff`) before anything writes anywhere, plus a **separate, human-reviewed** name-matching step (`pair`) rather than assuming token names and Figma variable names ever line up automatically. Neither tool auto-resolves a conflict; both produce a report a human acts on.

## Unresolved research question (raised 2026-09-13, not yet investigated)

**How do Primer's actual designers/contributors edit a token day-to-day?** Confirmed so far: `buildFigma.ts` only reads JSON5 and writes toward Figma — no reverse path in that script. But that only proves *the build script* is one-directional; it says nothing about whether a human at GitHub literally hand-types multi-thousand-line `.json5` files by hand, or whether some other tool (a CLI wizard, an internal color-picker script, a bot that opens a PR from a form submission, a VS Code extension) generates/edits those files on their behalf — making the *artifact* hand-authored JSON even though the *human experience* isn't "open a text editor and type JSON."

This matters directly for Cuboid's decision above: if Primer's designers don't actually hand-write JSON either, then "Primer hand-authors" is a less useful data point than it sounds, and the real question becomes what tool *should* mediate that authoring for Cuboid — not whether to skip straight to a full bidirectional Figma sync.

**Not yet checked, in order of likely evidence value:**
- `CONTRIBUTING.md` in `primer-primitives-reference` — may describe the actual human workflow for proposing a token change (PR process, required tooling, review gate).
- Whether `primer/prism`'s repo (not just its README, which was already checked) has any script/CLI that writes tokens in the DTCG shape directly, rather than just displaying a picker.
- Whether the "Primer Design Token Manager" plugin has an export-back-to-JSON feature, not just import-into-Figma (its own listing 403'd for the earlier research pass — a logged-in Figma session or a different fetch approach might succeed where an anonymous fetch didn't).
- Git history of `primer-primitives-reference`'s `.json5` files: do individual commits look like a human's small, deliberate hex edits (consistent with hand-typing or a simple tool), or do they look like large, bot-shaped bulk replacements (consistent with a generator)?

## Source

Background research agent, this session (2026-09-13): read `primer-primitives-reference`'s adr-007, adr-008, adr-011, `contributor-docs/design/color-scales.md`, `scripts/buildFigma.ts`, `src/formats/jsonFigma.ts`, `src/platforms/figma.ts`, all `.github/workflows/*.yml` in both Primer repos, and fetched `github.com/primer/prism`'s README.
