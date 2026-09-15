# Dimension A — Purpose, Principles & Scope

**Status:** v2 — proposal for adoption. The v1 draft centered on "AI-native"; the thought experiment of removing it showed it was positioning-level material, not paradigm-level (nearly nothing structural changed without it). v2 is built from paradigm-level material: the weave of three foundations. AI-composability remains — as a *consequence* claimed in positioning (§3), not as the purpose. Remaining open decisions are marked `D-` and collected in §8.

**Parent:** [dimensions.md](./dimensions.md), Dimension A.

---

## 1. A1 — Purpose

> **Cuboid is a generative grammar of interfaces woven from three foundations — the web's own semantics, the structure of data, and the constants of human cognition. A small set of primitives and composition rules from which anyone can compose any interface, from data-dense enterprise tools to simple pages, with accessibility and cognitive soundness guaranteed by construction.**

Unpacking the load-bearing words:

- **Grammar, not inventory.** The two proven precedents for "build anything from little" — [Vega-Lite](https://idl.cs.washington.edu/files/2017-VegaLite-InfoVis.pdf) for charts, [Alexander's pattern language](https://ieeexplore.ieee.org/document/804820/) for the built world (and, via the patterns movement, for software) — both make the same move: a finite vocabulary arranged grammatically, generating an unbounded space of valid wholes, with validity preserved by the rules rather than re-checked per artifact. A component list can only anticipate; a grammar generates. This also dissolves the standardization↔flexibility tension that the [CHI 2022 study of design-systems practice](https://arxiv.org/pdf/2205.10713) identifies as the field's #1 failure mode: in a grammar, flexibility *is* recombination inside the rules, so it never requires forking out of the system.
- **Guaranteed by construction.** Accessibility (WCAG/ARIA) and cognitive constraints live in the grammar's rules, not in review processes or documentation advice. If an invalid composition is expressible, that is a grammar bug. This is the system's central, falsifiable promise.
- **What Cuboid transfers** (per the master equation in [dimensions.md](./dimensions.md) — a design system transfers decisions): staged as (1) accessibility correctness, (2) cognitive soundness, (3) data-representation choices, (4) interaction patterns. Visual taste is transferred only as a *default theme* — deliberately replaceable (see §5).
- **Anyone** = human developers first; agents compose in the same grammar for free (§3).

## 2. The three foundations (the weave)

**Principle 1 in §4 makes this operational.** Each foundation rests on a mature theory; the weaving of the three is what has never been done.

### 2.1 Web — the platform is already a semantic system; enrich it, never parallel it

HTML elements carry meaning; [WAI-ARIA](https://www.w3.org/TR/WCAG22/) extends that meaning to widgets HTML lacks; the **accessibility tree** is a machine-readable projection of interface semantics that the platform already ships. Cuboid's semantic layer *is* that projection — never a private vocabulary beside it.

React Aria supplies the enabling theorem: a component decomposes into **state / behavior / rendering**, and the first two are separable from any design system and adoptable wholesale ([architecture](https://react-spectrum.adobe.com/react-aria/hooks.html)). So the grammar can own composition and rendering while inheriting years of assistive-technology hardening at the behavior layer.

**Membership test:** every primitive must project cleanly onto the accessibility tree. A composition that cannot be expressed in platform semantics is outside the grammar.

### 2.2 Data — representation is an algebra, not a taxonomy

Wilkinson's grammar of graphics, operationalized by Vega-Lite ([IEEE TVCG 2017](https://ieeexplore.ieee.org/document/7539624/)): visualizations are not a list of chart types but expressions in a pipeline — **typed fields (quantitative, ordinal, nominal, temporal) → transforms → scales → encoding channels → marks**, plus a composition algebra (layer, facet, concat, repeat) and an interaction grammar (selections).

Cuboid's extension — the one nobody has made: **generalize the encoding channels beyond position and color to structural channels** — column, row, grouping, hierarchy depth, sort order, emphasis. Then a table, a tree view, a kanban board, and a list are revealed as the same thing: *encodings of typed collections with different mark systems*. Cuboid's existing data views are the natural first proof, and where the "data-intensive enterprise" half of the ambition earns its credibility.

**Membership test:** every data-bearing primitive must be expressible as an encoding of typed fields. If a "component" can't say what fields it encodes onto what channels, it is not a data primitive.

### 2.3 Cognition — constants as constraints, and an interaction model underneath

Two strata:

**(a) Perceptual/motor invariants, encoded where they cannot be ignored.** Fitts's law → token floors on target size and spacing. Hick–Hyman → choice-count thresholds that trigger progressive disclosure or search. Working-memory limits (Miller) → chunking rules in forms and navigation. Gestalt proximity → the spacing scale must keep "related" and "unrelated" at perceptibly distinct ratios. Existing systems put these in documentation as advice; advice decays. Constraints in the grammar *generate* correctness — this is where the weave and "valid by construction" fuse into one mechanism.

**(b) The interaction model: instrumental interaction** (Beaudouin-Lafon, [CHI 2000](https://dl.acm.org/doi/10.1145/332040.332473); [AVI 2004](https://www.lri.fr/~mbl/papers/AVI2004/paper.pdf)). Interfaces are **domain objects** plus **instruments** that mediate the user's action on them — design the interaction, not the interface. Therefore Cuboid's primitives are *objects and instruments, not widgets*: a date picker is an instrument acting on a temporal value; a table is a collection object with sort and selection instruments attached. Beaudouin-Lafon's evaluation criteria for instruments — **degree of indirection, degree of integration, degree of compatibility** — become the review rubric for every proposed primitive.

### 2.4 The seams — where the weave earns the word "true"

The pairwise junctions are themselves principled, not incidental:

- **data × web:** every encoding must emit platform semantics — a table encoding produces real table/grid roles, so data structure reaches assistive technology for free.
- **web × cognition:** platform behaviors run under motor constraints — focus order, target sizes, pointer/keyboard equivalence.
- **data × cognition:** the choice of encoding channel follows perceptual effectiveness — Cleveland & McGill's graphical-perception experiments (the ranking Vega-Lite's defaults derive from): position > length > angle > color for quantitative accuracy.
- **All three meet** where instruments attach to encodings: sort attaches to a column channel, filter to a field, selection to records — an object (data), operated through an instrument (cognition), rendered as platform semantics (web).

## 3. Positioning — "not like Tailwind or Radix," made precise

| System | What it abstracts | What it ignores |
|---|---|---|
| **Tailwind** | *Style*: a utility grammar over CSS values | Behavior, semantics, data, meaning |
| **Radix Primitives** | *Behavior*: unstyled interactive primitives | Style, data, composition rules |
| **React Aria** | *Behavior + semantics* (state/behavior/rendering split) | Style, data, visual language |
| **shadcn/ui** | *Distribution* (copyable source) | Abstraction itself |
| **Material / Carbon / Polaris** | *One brand's complete language* | Foundationalism |
| **Vega-Lite** | *Data → visual encoding* grammar | Everything outside charts |

Each occupies exactly one pillar. **Cuboid's position: the unoccupied junction — one composable grammar across style, behavior, data-binding, and cognitive constraint.**

**AI-composability, claimed here as consequence.** The generative-UI literature has converged on constraining agents to **schema-validated composition over a fixed inventory of vetted parts** rather than free code generation ([Macaron-A2UI](https://arxiv.org/html/2605.24830v1); [Portal UX Agent](https://arxiv.org/pdf/2511.00843); [GenUI study](https://arxiv.org/pdf/2501.13145)). A grammar with contracts-as-data (Principle 7) *is exactly that substrate* — so agents compose valid, accessible Cuboid UIs without Cuboid ever having "AI-native" as a goal. The capability is free; only the framing changed. Agent-facing surface (e.g. an MCP server exposing the contracts) is an optional derived layer, never core scope.

## 4. A2 — Principles

Each principle must arbitrate real disputes (following it must cost something), and each traces to §2's research.

1. **One weave.** Every primitive must have an account in all three theories: as platform semantics, as an operation on typed data, and as an object-or-instrument under cognitive constraints. A proposed part lacking one of the three accounts is not foundational — it is a convenience, and belongs in the derived layer or nowhere. *Arbitrates: what deserves to be a primitive.*
2. **Grammar over inventory.** When a need appears, extend the grammar's expressiveness; never add a one-off component. *Arbitrates: "just add a component for this" → no.*
3. **Valid by construction.** Constraints live in the rules, not the review. An expressible-but-invalid composition is a grammar bug with the same severity as a crash. *Arbitrates: shipping speed vs. constraint work.*
4. **Objects and instruments, not widgets.** Primitives model what users act on and act with. *Arbitrates: naming and decomposition disputes.*
5. **Data is typed before it is styled.** Representation derives from field type and task, never from aesthetics alone. *Arbitrates: visual-first feature requests.*
6. **Smart defaults, explicit overrides.** Concise expressions produce correct-by-default output (Vega-Lite's compiler stance); escaping defaults is possible, visible, never silent. *Arbitrates: the flexibility↔consistency tension, case by case.*
7. **Contracts as data.** Every contract — token, primitive semantics, composition rule — exists as machine-readable data; human documentation is a generated view of it. Kept from v1 as an engineering principle (it powers validation, linting, generated docs — and keeps §3's free lunch free), no longer as identity. *Arbitrates: "we'll document it later" → the contract ships as data or the part doesn't ship.*

## 5. A3 — Design language

Inverted from the usual order: in a grammar-first system the visual language is *derived* (base tokens + derivation rules), not authored per component. Stance: **neutral substrate with one excellent default theme** — "public, anyone can use" demands that themes can fully replace Cuboid's taste; foundationalism forbids a mandatory aesthetic identity. What still requires authored taste: the default theme's type scale, spatial rhythm, color voice, motion character, and density modes for data-intensive contexts. The full design-language work belongs to the Dimension B deep dive (token architecture), because in this paradigm the language *is* the base token layer plus derivation rules.

## 6. A4 — Scope & boundary

"Build anything" is a claim about the grammar's *expressiveness*, not a license for unbounded scope. Concentric layers, inside → out:

1. **Core grammar** — primitives (objects, instruments, encodings), composition rules, constraint system, contracts-as-data. *The product.*
2. **Foundations** — tokens ([DTCG format](https://design-tokens.github.io/community-group/format/), stable 2025.10), themes, density modes; platform-semantic base elements.
3. **Data plane** — the differentiated middle: typed-collection encodings (tables, data views, tree/JSON views, lists) as grammar expressions. Where Cuboid already lives; the first proof ground.
4. **Derived patterns** — published compositions (forms, shells, navigation), each demonstrably *derivable* from the grammar. Non-derivability is a grammar-incompleteness finding, not a reason to hand-write.
5. **Generated surfaces** — documentation generated from contracts; optionally, agent-facing interfaces. Thin, replaceable, never load-bearing.

**Non-goals:** not a CSS utility framework (Tailwind exists); not a chart library (Vega-Lite exists — interoperate with that lineage instead); not a Figma-first workflow (contracts and code are the source of truth); not brand-identity tooling.

**Platform:** web-platform semantics in the contracts; React as the sole *implementation* for now. Contracts outlive frameworks (D-4).

## 7. A5 — Build vs. adopt

| Layer | Verdict |
|---|---|
| Behavior/a11y primitives (focus, keyboard, ARIA wiring) | **Adopt** (React Aria or Radix) — years of assistive-tech hardening; rebuilding is undifferentiated liability. React Aria's hooks were designed to underlie other systems. → D-5 |
| Token format | **Adopt the standard** (DTCG), **build the architecture** (Cuboid's layering and derivation rules). |
| The grammar — primitives, composition rules, constraint encoding, contracts | **Build.** Exists nowhere. The actual invention. |
| Data-encoding layer for UI (tables/views as grammar) | **Build**, borrowing grammar-of-graphics theory. Also exists nowhere as a design system. |
| Generated docs / optional agent surface | **Build thin**, on standards. |

The strategic risk is not "someone builds a better button" — it's "someone ships the grammar first." Every hour spent re-implementing the adopted layers is taken from the novelty.

## 8. Remaining decisions

Reduced from v1's nine (Q-1 and Q-3 dissolved with the reframing; Q-4 and Q-5 are adopted into §1):

| # | Decision | Current lean |
|---|---|---|
| D-1 | Public = published + single-steward, or community-governed? | Published, single-steward; revisit at real adoption (Dimension G) |
| D-2 | Ratify the seven principles (§4) — any rejected or amended? | — |
| D-3 | Default aesthetic: confirmed neutral-substrate + one excellent default theme? | Yes (per §5) |
| D-4 | Contracts framework-agnostic, React-only implementation? | Yes |
| D-5 | Re-found the behavior layer on React Aria (or Radix) beneath the grammar? | Yes — the biggest architectural fork; decide before grammar *implementation* begins (grammar *theory* can proceed regardless) |

## 9. Where we're headed

With A adopted, the deep-dive order from [dimensions.md](./dimensions.md) gets one refinement: because the purpose declares a *grammar*, Dimension B's deep dive begins with the grammar's theory, not with code.

1. **B0 — The Grammar** (`docs/grammar.md`, next): the abstraction itself. Must answer: the primitive type system (objects, instruments, encodings, constraints — and their triple accounts per Principle 1); the composition algebra (what combines with what, and what the rules preserve); the constraint system (how Fitts/Hick/Gestalt/WCAG become enforced rules rather than advice); the contract format (the machine-readable shape of a primitive). **Acceptance test:** derive existing Cuboid components (Table, and one simple control) as grammar expressions — anything not derivable exposes either a grammar gap or a component that shouldn't exist.
2. **B1 — Token architecture:** DTCG layering (base → semantic → component), derivation rules, density/theme axes — the design-language substrate of §5.
3. **B-gap — Cuboid today vs. the grammar:** the first evaluative pass (the audit finally begins, now that there is a yardstick): map current `src/` and `tokens/` against B0/B1; classify each part as *conforming / derivable / convenience / contradiction*.
4. **D — Consumer experience** (Clarke's cognitive-dimensions instrument), then **E** (WCAG/ARIA conformance — partly guaranteed by construction if B0 does its job), then **F, C, G, H** per the parent doc.

Each step remains one deliverable, one conversation, per the discovery discipline.

---

## Sources

- Satyanarayan, Moritz, Wongsuphasawat, Heer, [Vega-Lite: A Grammar of Interactive Graphics](https://idl.cs.washington.edu/files/2017-VegaLite-InfoVis.pdf), IEEE TVCG 2017 ([IEEE](https://ieeexplore.ieee.org/document/7539624/); [project](https://vega.github.io/vega-lite/)); Wilkinson, *The Grammar of Graphics*
- Cleveland & McGill, *Graphical Perception* (JASA 1984) — perceptual effectiveness ranking of encoding channels
- Beaudouin-Lafon, [Instrumental Interaction](https://dl.acm.org/doi/10.1145/332040.332473) (CHI 2000); [Designing Interaction, not Interfaces](https://www.lri.fr/~mbl/papers/AVI2004/paper.pdf) (AVI 2004)
- Alexander's pattern language and its generativity: [IEEE Software](https://ieeexplore.ieee.org/document/804820/); [Exploring the Generative Nature of Patterns, PLoP](https://dl.acm.org/doi/abs/10.5555/3721041.3721053)
- [React Aria architecture](https://react-spectrum.adobe.com/react-aria/hooks.html) — state/behavior/rendering separation; [accessibility quality](https://react-spectrum.adobe.com/react-aria/accessibility.html)
- [W3C Design Tokens Format Module 2025.10](https://design-tokens.github.io/community-group/format/); [WCAG 2.2](https://www.w3.org/TR/WCAG22/); WAI-ARIA Authoring Practices
- Churchill et al., [Understanding and Supporting the Design Systems Practice](https://arxiv.org/pdf/2205.10713), CHI 2022
- Bounded generative UI (grounding §3's consequence claim): [Macaron-A2UI](https://arxiv.org/html/2605.24830v1); [Portal UX Agent](https://arxiv.org/pdf/2511.00843); [The GenUI Study](https://arxiv.org/pdf/2501.13145)
- Fitts (1954), Hick (1952), Miller (1956) — perceptual/motor constants; ISO 9241-11 (see [dimensions.md](./dimensions.md))
