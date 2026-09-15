# Dimensions of a Design System — an Ontology for Evaluation

**Status:** Discovery stage. This document defines *what* to evaluate, not yet *how*. Each dimension will get its own deep-dive document (theory of "what good looks like" → evaluation strategy → feedback loop), one at a time.

---

## 1. The meta-question: how do you measure the efficacy of a system?

Before listing dimensions, we need a theory of measurement. Systems theory (Donella Meadows, *Thinking in Systems*; [Leverage Points](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/)) says every system consists of three things:

1. **Elements** — the visible parts (for us: tokens, components, docs, code).
2. **Interconnections** — how parts relate (dependencies, naming schemes, contribution flows, versioning).
3. **Purpose** — the function the system actually serves, revealed by its behavior, not its mission statement.

Two consequences for evaluation:

**(a) Efficacy is measured against purpose, not against parts.** A design system's purpose is to **transfer design decisions across an organization at scale, with high fidelity and low cost, repeatedly over time**. So the master equation is roughly:

> Efficacy = (fidelity of decision transfer) × (breadth of adoption) ÷ (cost to build, use, and maintain) — sustained over time.

A beautiful component library nobody uses has zero efficacy. A widely-used one that everyone forks and modifies has low fidelity. A perfect, adopted one that its team burns out maintaining has no sustainability. All three factors must be in the model.

**(b) Not all dimensions have equal leverage.** Meadows ranks interventions: changing *parameters* (a color value, a padding number) is the weakest lever; changing *feedback loops* (how usage data reaches maintainers) is stronger; changing *system structure* (token architecture, contribution model) is stronger still; changing *goals and paradigms* (what the system is even for) is the strongest. Our evaluation should therefore weight structural and feedback-loop findings above cosmetic ones — a flawed token architecture matters more than a wrong hex value.

**(c) One measurement template recurs everywhere.** [ISO 9241-11](https://www.iso.org/obp/ui/#iso:std:iso:9241:-11:ed-2:v1:en) defines usability as **effectiveness** (can the user achieve the goal accurately and completely?), **efficiency** (at what cost in time/effort?), and **satisfaction** (how does it feel?) — *for specified users, goals, and context*. This triple applies at every interface of the design system: a developer consuming a component, a designer using the Figma library, an end user operating the shipped UI, a contributor submitting a change. When we build evaluation strategies per dimension, each will instantiate this triple for its specific "user."

**(d) Distinguish stocks from flows, lagging from leading.** Adoption *rate* is a stock (where we are); contribution velocity and drift rate are flows (where we're heading). Healthy systems are judged by their flows and feedback loops, not just snapshots.

---

## 2. Deriving the dimensions (why these, why this many)

A design system is a **socio-technical system**: an artifact plus the people and processes around it. To decompose it without gaps or overlaps, cut along three axes:

- **The artifact itself** — its intent (why) and its construction (what/how). → Dimensions A, B
- **The populations that touch it** — three distinct groups with distinct needs: those who *build* it, those who *use it to build products*, and those who *use the products*. → Dimensions C, D, E
- **The system in its environment over time** — how it spreads (adoption), how it's governed, and how it learns and evolves. → Dimensions F, G, H

This maps closely to the taxonomy in the peer-reviewed study of design-systems practice ([*Understanding and Supporting the Design Systems Practice*, CHI 2022](https://arxiv.org/pdf/2205.10713)): scope, maturity, governance, distribution, and user engagement — plus the quality standards each layer inherits from its own discipline (software quality, API usability, accessibility, HCI).

Your original guesses map cleanly: "DX–Usage/Consumption" → D; "DX–Building" → C; "Code itself" → B; "Design System as Code / guidelines" → A + B; "End User" → E; "Adoption by use cases" → F. The research adds two you hadn't named — **Governance & Operations (G)** and **Dynamics & Feedback Loops (H)** — which the literature consistently identifies as the reason design systems fail even when the code is good (NN/g: "most design systems fail without someone actively enforcing the rules").

---

## 3. The eight dimensions

### A. Purpose, Principles & Scope
*The system's "why" — highest leverage, evaluated first because everything else is judged against it.*

| Subdimension | Question it answers |
|---|---|
| A1. Purpose definition | What decisions does this system exist to transfer? For whom? What's explicitly out of scope? |
| A2. Design principles | Are there stated, decision-guiding principles (not platitudes)? Can they actually arbitrate disagreements? |
| A3. Design language | Is there a coherent visual/interaction language (color, type, space, motion, voice) from which parts derive, or just a pile of parts? |
| A4. Scope & boundary | Which products/platforms/use cases is it for? Is the boundary explicit? (Cuboid: data views, tables, themed UI — is that the real boundary?) |
| A5. Build-vs-adopt rationale | Why a bespoke system rather than adopting/extending an existing one? Is the differentiation real? |

*Grounding: Meadows (goals/paradigm as top leverage points); CHI 2022 "scope" dimension.*

### B. The Artifact — Architecture & Code Quality
*The system as built: tokens, components, code, repo. Your "Code itself" + "Design System as Code."*

| Subdimension | Question it answers |
|---|---|
| B1. Token architecture | Do tokens follow a layered model (base/primitive → functional/semantic → component)? Do they conform to the [W3C Design Tokens Format Module](https://design-tokens.github.io/community-group/format/) (first stable version 2025.10)? Is naming systematic and theme-able? |
| B2. Component anatomy | Is there a consistent internal structure per component (slots, states, variants, composition model)? Are states (hover/focus/disabled/error/loading) systematically covered? |
| B3. Code quality | The [ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010) characteristics, especially **maintainability** (modularity, reusability, analysability, modifiability, testability), plus reliability and performance efficiency. |
| B4. Repo & package structure | Build system, exports map, tree-shaking, CSS strategy, dependency hygiene, TypeScript soundness of public types. |
| B5. Theming & extensibility architecture | Can consumers re-theme without forking? Are extension points designed or accidental? |
| B6. Versioning & distribution | Semantic versioning discipline, changelogs, deprecation policy, migration paths, release cadence. |
| B7. Testing infrastructure | Unit/visual-regression/accessibility/interaction test coverage of the system itself. |

*Grounding: ISO/IEC 25010; W3C DTCG spec; CHI 2022 "distribution."*

### C. Producer Experience — Building the System
*The experience of the people (or agents) who create and maintain it.*

| Subdimension | Question it answers |
|---|---|
| C1. Contribution model | How does a change get in? Is the path documented, low-friction, and quality-gated? |
| C2. Authoring ergonomics | How hard is it to add a component/token correctly? Are there templates, generators, conventions that make the right way the easy way? |
| C3. Local development loop | Speed and fidelity of build/preview/test while developing the system. |
| C4. Docs-as-you-build | Is documentation produced as a byproduct of building (stories, prop-table generation), or a separate chore that gets skipped? |
| C5. Maintainer sustainability | Bus factor, workload, burnout risk; the CHI 2022 study found long-term survival depends on treating the system as a funded, living product. |

*Grounding: CHI 2022 (contribution & maintenance findings); ISO 9241-11 applied with "maintainer" as the user.*

### D. Consumer Experience — Using the System in Apps
*Developer experience of the system's public interface. Your "Usage, Discovery, Understanding, Prop Discovery, Flexibility, Implementation, Consumption."*

| Subdimension | Question it answers |
|---|---|
| D1. Discoverability | Can a consumer find whether a component/token exists for their need? (Search, naming predictability, catalog.) |
| D2. Understandability | Once found, can they understand what it does, when to use it vs. its neighbors, and its constraints? (Docs, examples, do/don't guidance.) |
| D3. API usability | Clarke's **Cognitive Dimensions of API usability** ([Improving API Usability, CACM 2016](https://dl.acm.org/doi/10.1145/2896587); [CMU](https://www.cs.cmu.edu/~NatProg/papers/API_Usability_Article_submitted.pdf)) — the academic framework for exactly your "prop discovery" instinct. Key dimensions: **abstraction level** (does the API match how consumers think?), **working framework** (how much must be in your head at once?), **progressive evaluation** (can you check partial work?), **premature commitment** (are you forced into early decisions?), **penetrability** (can you see inside when needed?), **consistency** (does learning one component teach the next?), **role expressiveness** (does the code reveal what it does when read?), **domain correspondence** (do names map to the consumer's domain?). |
| D4. Flexibility & escape hatches | The standardization↔flexibility tension (the #1 challenge in CHI 2022). Can consumers customize *within* the system before being pushed *out* of it (forking)? Is the escape-hatch gradient designed? |
| D5. Integration & upgrade cost | Install-to-first-render time; friction of version upgrades; peer-dependency and styling conflicts in real apps. |
| D6. Error experience | What happens when a consumer misuses the API? (Type errors, runtime warnings, silent failure?) |
| D7. Feedback channel | Can consumers report gaps/bugs and see them acted on? (This is also loop H1 — the interconnection matters.) |

*Grounding: Clarke's Cognitive Dimensions framework; ISO 9241-11 with "consuming developer" as the user.*

### E. End-User Experience — What the System Ships
*The system as experienced by people using products built with it. The system's quality ceiling propagates: a flaw here is multiplied across every adopting product.*

| Subdimension | Question it answers |
|---|---|
| E1. Accessibility | Conformance to [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (4 principles — Perceivable, Operable, Understandable, Robust; 13 guidelines; A/AA/AAA criteria) and component-level semantics per the W3C **WAI-ARIA Authoring Practices** patterns (roles, states, keyboard interaction per widget type). |
| E2. Usability | ISO 9241-11 effectiveness/efficiency/satisfaction of the shipped patterns; Nielsen's 10 usability heuristics as the inspection instrument. |
| E3. Cognitive & perceptual fit | The "Laws of UX" grounded in actual psychology: Fitts's law (target sizes), Hick–Hyman (choice complexity), Miller/working-memory limits (chunking), Gestalt principles (grouping, proximity). These should be *encoded in the components* — e.g., minimum touch-target tokens. |
| E4. Interaction feedback & states | Loading, empty, error, success states; perceived responsiveness; motion that communicates rather than decorates. |
| E5. Runtime performance | Bundle weight, render performance, layout stability as experienced by end users. |
| E6. Visual & behavioral consistency | Does the same intent look and behave identically everywhere? (Consistency is the design system's core promise to end users.) |
| E7. Internationalization & resilience | Long strings, RTL, small viewports, zoom to 400% (a WCAG 2.2 criterion), degraded network. |

*Grounding: WCAG 2.2; WAI-ARIA APG; ISO 9241-11; Nielsen heuristics (NN/g); experimental psychology (Fitts 1954, Hick 1952, Miller 1956).*

### F. Adoption & Coverage — the System in its Ecosystem
*Reach and fidelity of the decision transfer. Your "Adoption by use cases."*

| Subdimension | Question it answers |
|---|---|
| F1. Use-case coverage | Of the UI needs in consuming products, what fraction can the system express? Where are the gaps? |
| F2. Adoption depth | Not just "is it installed" but what share of the UI is built from system parts vs. custom code. |
| F3. Fidelity / drift | Are components used as designed, or wrapped, overridden, and forked? (Adoption without fidelity is a false positive — the literature's most-cited measurement trap.) |
| F4. Gap response | When a consumer hits a missing use case, what happens — contribution, request, or silent fork? The distribution of these three outcomes is a top-level health metric. |
| F5. Design–code parity | Do the Figma library (if/when one exists) and the code express the same system, or two diverging ones? |

*Grounding: CHI 2022 "user engagement"; architectural-drift literature; measurement-trap findings from adoption-metrics research.*

### G. Governance & Operations
*The organizational machinery. The literature's consistent finding: this, not code quality, is where design systems die.*

| Subdimension | Question it answers |
|---|---|
| G1. Decision rights | Who decides what enters, changes, or is deprecated? Is authority explicit? (CHI 2022: ambiguous authority ⇒ stagnation.) |
| G2. Quality gates | What review — design, code, a11y, API — does a change pass? Are the gates enforced or aspirational? |
| G3. Support model | How do consumers get help? Response expectations, office hours, triage. |
| G4. Roadmap & prioritization | Is evolution demand-driven and visible, or reactive and opaque? |
| G5. Documentation governance | Who keeps docs true as code changes? Staleness is a governance failure, not a writing failure. |
| G6. Resourcing | Is the system funded as a product with an owner, or an unfunded side effect? |

*Grounding: CHI 2022 governance findings; NN/g (enforcement, DesignOps, lean-team research).*

### H. Dynamics & Feedback Loops — the System over Time
*The pure systems-thinking dimension: not the state of the system but its capacity to sense, learn, and adapt. High leverage per Meadows — and the dimension this whole evaluation project belongs to.*

| Subdimension | Question it answers |
|---|---|
| H1. Sensing | Does the system have instrumentation at all — usage analytics, drift detection, consumer sentiment, a11y regression detection? (You can't have a feedback loop without a sensor.) |
| H2. Loop closure | Do signals actually reach decisions? Measured gap-to-action latency: how long from "consumers keep forking Button" to a Button API change? |
| H3. Balancing loops (entropy control) | Mechanisms that pull the system back to coherence: deprecation, codemods, lint rules, migration tooling, periodic audits. |
| H4. Reinforcing loops (growth) | Mechanisms where adoption breeds adoption: contribution converts consumers into producers; visible wins recruit new teams. |
| H5. Adaptability | Cost of absorbing a paradigm change (new brand, new framework, dark mode, density themes) — the system's survival trait. |
| H6. Evaluation of the evaluation | Are the metrics themselves reviewed? Goodhart's law: any adoption metric that becomes a target will be gamed (e.g., wrapping everything in a system component without using it). |

*Grounding: Meadows (feedback loops rank above structure and parameters as leverage points); stocks-vs-flows distinction.*

---

## 4. Interconnections (dimensions are not independent)

The most important edges, because interventions travel along them:

- **A constrains everything** — you cannot judge B–H without A's answers. (Evaluate A first.)
- **B1 (token architecture) → D4 (flexibility) → F3 (drift):** a semantic token layer is what makes customization possible *inside* the system; without it, flexibility demands become forks.
- **D7 + G3 + H2 form the primary feedback loop:** consumer signal → governance decision → shipped change. Its latency is arguably the single best proxy for overall system health.
- **C5 (maintainer sustainability) is the load-bearing stock:** every other dimension degrades when it's depleted.
- **E is multiplicative:** an accessibility defect in one component is a defect in every adopting product — which is also the argument for fixing it centrally (highest ROI surface).

## 5. Proposed deep-dive order

One dimension at a time, as agreed. Suggested order, by leverage and by dependency:

1. **A — Purpose, Principles & Scope** (everything else is judged against it; cheapest to do; Cuboid is young so it's decidable now)
2. **B — Architecture & Code Quality** (structural leverage; hardest to change later; token architecture decisions cascade)
3. **D — Consumer Experience** (the system's primary interface; Clarke's framework gives us a ready instrument)
4. **E — End-User Experience** (WCAG/ARIA give ready conformance instruments; multiplicative payoff)
5. **F — Adoption & Coverage** (needs consuming apps — portfolio — as the measurement field)
6. **C, G** (producer experience & governance — lighter-weight for a solo/small-team system, but the sustainability questions still apply)
7. **H — Dynamics** (designed last but informed by all the above: which sensors and loops to build)

Each deep dive will produce: (i) the reference model — what good looks like, per subdimension, with sources; (ii) evaluation strategy — instruments, evidence, scoring; (iii) the feedback loop — how findings become refactoring work and how we detect regression.

---

## Sources

- Donella Meadows, [Leverage Points: Places to Intervene in a System](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/); *Thinking in Systems* (elements / interconnections / purpose; stocks & flows)
- [ISO 9241-11:2018 — Usability: definitions and concepts](https://www.iso.org/obp/ui/#iso:std:iso:9241:-11:ed-2:v1:en) (effectiveness / efficiency / satisfaction in context)
- [ISO/IEC 25010 — software product quality model](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010) (maintainability and its five sub-characteristics)
- Churchill et al., [Understanding and Supporting the Design Systems Practice](https://arxiv.org/pdf/2205.10713) (CHI 2022 — empirical study; governance, adoption, contribution, maintenance findings)
- Myers & Stylos, [Improving API Usability](https://dl.acm.org/doi/10.1145/2896587), CACM 2016; [CMU NatProg version](https://www.cs.cmu.edu/~NatProg/papers/API_Usability_Article_submitted.pdf) (Clarke's Cognitive Dimensions of API usability)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/) (POUR principles, A/AA/AAA); WAI-ARIA Authoring Practices (component semantics & keyboard patterns)
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/); [Design Tokens Format Module 2025.10](https://design-tokens.github.io/community-group/format/) (first stable token spec)
- Nielsen Norman Group, [Design Systems and Their Benefits](https://www.nngroup.com/videos/design-systems/) and design-process research (enforcement & lean-team findings)
