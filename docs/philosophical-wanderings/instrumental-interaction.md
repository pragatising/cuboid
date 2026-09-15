# Instrumental Interaction — Reference Note for the Grammar (B0)

**Sources (read in full):** Beaudouin-Lafon, *Instrumental Interaction: An Interaction Model for Designing Post-WIMP User Interfaces* ([CHI 2000](https://dl.acm.org/doi/10.1145/332040.332473)); *Designing Interaction, not Interfaces* ([AVI 2004](https://www.lri.fr/~mbl/papers/AVI2004/paper.pdf)); with Mackay, *Reification, Polymorphism and Reuse* (AVI 2000, cited therein).

**Role of this note:** primary-source grounding for the cognition pillar's interaction model ([dimension-a-purpose.md](./dimension-a-purpose.md) §2.3b) and direct input to the B0 grammar doc.

---

## 1. The model itself

### 1.1 What an interaction model is (and why we need one)

> "An interaction model is a set of principles, rules and properties that guide the design of an interface. It describes how to combine interaction techniques in a meaningful and consistent way." (CHI 2000)

A good model must have three powers (AVI 2004): **descriptive** (covers existing interfaces), **evaluative** (compares alternatives with metrics, rather than prescribing good/bad a priori), and **generative** (helps create new designs). These three powers are exactly what Cuboid's grammar must have — the grammar *is* an interaction model made executable.

His diagnosis of WIMP explains why: a dialog box is a command line in disguise — select object, pick command from menu, fill fields, click OK ≈ command name, filename, arguments, return key. "Direct manipulation" interfaces routinely violate their own principles, because the *model* underneath was never made explicit. (And his framing is memorable: "HCI is not the science of user interfaces, just as astronomy is not the science of telescopes.")

### 1.2 Domain objects

The data the user actually cares about — text, records, shapes — with attributes (simple values or complex entities). Crucially, **secondary concepts earn domain-object status through use**: a paragraph style, a 3D material, a layer. WIMP's failure is leaving these trapped in transient dialog boxes instead of making them first-class, manipulable objects.

### 1.3 Instruments

An **interaction instrument is a two-way transducer between user and domain object** — the software analog of a physical tool. It decomposes every interaction into two layers with five named channels:

```
user —action→ instrument —command→ domain object
user ←reaction— instrument ←response— domain object
user ←feedback— (instrument transforms the object's response)
```

An instrument has a **physical part** (the input device) and a **logical part** (its on-screen/software representation). Example: a scrollbar — action: press arrow; reaction: arrow highlights; command: scroll; response: thumb updates; feedback: document view moves.

### 1.4 Activation — the theory of modes

Only a few instruments can be under the user's control at once (limited input devices), so instruments must be activated:

- **Spatial activation** — point at the instrument (scrollbar). Cost: screen real estate + divided attention.
- **Temporal activation** — a prior action puts the instrument in your hand until replaced (tool palette; i.e., a *mode*). Cost: an explicit switching action, slower, less direct.

Every toolbar/context-menu/keyboard-shortcut decision is a position in this trade-off space. Extra input devices (scroll wheel = an always-active scrolling instrument) buy out of the trade-off.

### 1.5 Reification and meta-instruments

**Reification turns concepts into objects.** Two kinds:

1. **Concept → domain object:** a style reifies a set of text attributes; a material reifies rendering properties. (For Cuboid: tokens and themes are reified design decisions — and should be inspectable, manipulable objects, not config.)
2. **Command → instrument:** a scrollbar reifies the scroll command. This is the discovery procedure for instruments: *find the verbs, reify them.*

Instruments are themselves potential objects of interest (the pencil → pencil sharpener → screwdriver chain), giving **meta-instruments**: menus and palettes are instruments that operate on instruments (they activate them).

His worked example shows the payoff: reifying search-and-replace from a dialog box into an *instrument* — type the search string and every occurrence highlights live in text and scrollbar; click an occurrence to replace it; click again to undo; edits to the document re-run the search. No Find/Next/Replace buttons at all, and undo becomes spatial rather than sequential.

### 1.6 The three properties (the evaluative instrument)

1. **Degree of indirection** — 2D: *spatial offset* (screen distance between the instrument's logical part and its object: handles ≈ zero, dialog boxes arbitrarily far) × *temporal offset* (time between action and the object's response: live-drag ≈ zero, OK-button = high). Short temporal offsets exploit the human perception–action loop and produce the sense of causality. Not a moral scale — a light switch benefits from spatial offset — but a designed choice.
2. **Degree of integration** — ratio of the DOFs the instrument controls to the DOFs the input device captures. Scrollbar = 1/2; a 2D panner = 1 (hence better for panning than two scrollbars); mouse-controlled 3D rotation = 3/2.
3. **Degree of compatibility** (renamed *conformance* in 2004) — similarity between the user's physical action and the object's response. Dragging: high. Scrollbar thumb-down-moves-document-up: low. Typing "12" into a point-size field to change visual size: very low.

### 1.7 The three design principles (the generative instrument)

From Beaudouin-Lafon & Mackay (AVI 2000):

- **Reification** — see 1.5.
- **Polymorphism** — an instrument should operate on as many object types as meaningfully possible (copy/paste works on text, drawings, sound). Few instruments × many objects, instead of many widgets × one context each.
- **Reuse** — of input (redo, macros) and output (copy-paste as reuse of prior results). He adds **currying**: a command with parameters becomes a *family* of pre-parameterized instruments (color swatches = curried apply-color).

**Existence proof:** the CPN2000 Petri-net editor, designed with these three principles, shipped with *no menus, no dialog boxes, no scrollbars, no title bars, and no selection* — and was "demonstrably more powerful and simpler to use" than its WIMP predecessor.

### 1.8 The architecture argument (AVI 2004)

His critique of toolkits is a direct attack on the **widget** as the unit of architecture: a widget encapsulates presentation + behavior + application interface in one box — fine for buttons, failing for drag-and-drop, toolglasses, bimanual input, anything cross-cutting. Event-callback programming then shatters conceptually linear interactions into fragments glued with shared state — "brittle code, hard to debug, hard to maintain."

His proposal: **interactions as first-class objects** — declarative hierarchical state machines, *independent of the objects they operate on*, loadable at runtime, able to run in parallel. And three properties any interaction architecture must have:

- **Reinterpretability** — usable in contexts and by users it wasn't designed for; supports co-adaptation (users appropriate and repurpose; development continues in users' hands).
- **Resilience** — withstands change and partial breakage; his example is HTML: almost any fragment of a page is still valid HTML, which is *why* the web grew by copy-editing.
- **Scalability** — perceived performance constant with data size (a million files, a thousand pages, a hundred users), with the strategies (caching, level-of-detail, threading) built into the architecture, not bolted on.

He also situates the model among three **interaction paradigms** — computer-as-*tool* (direct manipulation; where instrumental interaction lives), computer-as-*partner* (delegation, language, agents), computer-as-*medium* (humans communicating through the machine) — and argues no paradigm subsumes the others; ultimately all three must integrate.

Two cautions he issues that we should keep: a good model doesn't guarantee good designs ("one can create terrible interfaces with a good model"), and lab peak-performance of a technique can differ sharply from performance in context — different users exhibit object-centered vs. command-centered patterns, so the right move is often to offer *several* techniques for the same command and let context decide.

---

## 2. Lessons for Cuboid

**L1 — The instrument gives us the anatomy of an interactive primitive, ready for contracts-as-data.** The five-channel mediation structure (action, reaction, command, response, feedback) is a complete, machine-readable shape for an interaction contract. A Cuboid instrument contract can declare exactly these: its action vocabulary (pointer/keyboard — where WCAG operability plugs in), its reaction, the command it emits (typed against the object it targets), and its feedback. This slots straight into Principle 7 (contracts as data) and gives B0 its interactive-primitive schema almost for free.

**L2 — His widget critique is the independent derivation of our Principle 4.** "Break away from the widget model" (2004) is the same conclusion React Aria reached empirically (state/behavior/rendering separation) and that our grammar reaches ontologically. Three independent routes to one architecture is strong evidence it's the right decomposition: **objects and instruments, decoupled; interactions as first-class, object-independent, declarative (state machines).**

**L3 — Reification is the discovery procedure for the primitive inventory.** When designing the grammar: find the *concepts* (→ domain objects: tokens, themes, fields, selections, queries) and the *verbs* (→ instruments: sort, filter, select, navigate, edit). Test: if a capability exists only as a prop on a component (`sortable={true}`), it's an unreified command — the grammar wants a sort *instrument* attachable to any collection encoding. This is also the arbitration rule against feature-props accretion, the mechanism behind component API bloat.

**L4 — Polymorphism is "grammar over inventory," proven with an existence proof.** One instrument × all compatible object types is exactly why we generalize encodings (one selection instrument for table rows, tree nodes, list items — not three selection features). CPN2000 (no menus, no dialogs, no scrollbars, simpler *and* more powerful) is evidence that instrument-based design shrinks the primitive count while growing expressiveness — the grammar bet, validated in 2000.

**L5 — The three properties become measurable constraints in our system.** Degree of indirection → prefer low temporal offset (live preview over apply-buttons; this is also Clarke's "progressive evaluation" from the API-usability world — the same property at two interfaces). Degree of integration → input-device fit for multi-DOF operations. Degree of conformance → action should mirror response. These are quantifiable per composition, so they belong in the constraint system (B0) and in Dimension D/E evaluation instruments — alongside Fitts and Hick, but at the *interaction* level rather than the motor level.

**L6 — Activation cost is a property of composition, not of components.** Spatial vs. temporal activation (and their costs: real estate + attention vs. mode-switch) gives the grammar a principled way to evaluate derived patterns — toolbars, context menus, command palettes, keyboard maps are all *meta-instrument placements* with computable trade-offs, not stylistic choices.

**L7 — Reinterpretability, resilience, scalability are acceptance criteria for the grammar itself.** Reinterpretability ↔ our H5 (adaptability) and the escape-hatch gradient (D4): can users compose uses we didn't anticipate *inside* the rules? Resilience ↔ the HTML lesson: prefer grammars where partial/imperfect expressions still mean something (tension to resolve against "valid by construction" — strictness for agents, tolerance for humans mid-edit; likely answer: valid-by-construction at commit, resilient during composition). Scalability ↔ Cuboid's data-intensive claim: constant perceived response with collection size must be built into the *encodings* (virtualization as a grammar property, not a component feature).

**L8 — Semantic pointing warns us: cognitive constraints are contextual, not component-local.** The Mac-vs-Windows menu-bar example (edge targets have infinite motor-space height; a 1px border destroys it) shows Fitts-law compliance is a property of *placement in composition*, not of a component's own dimensions. Our constraint system must therefore evaluate compositions, not just primitives — token floors alone are insufficient.

**L9 — The paradigm map locates our AI story precisely.** Cuboid's grammar operationalizes computer-as-*tool*. Agents composing UIs are computer-as-*partner*. His 2004 claim that the paradigms "must ultimately be integrated into a single vision" is our §3 consequence-claim from twenty years earlier: the grammar is the integration point — the partner (agent) builds the tools (instruments) the human uses on their objects.

**L10 — Two humilities to encode in our process.** A good grammar won't guarantee good interfaces (taste still required — the default theme and derived patterns need design judgment, per A3), and lab-validated constraints must be re-checked in context of use (ISO 9241-11's "specified context" clause; offer alternative techniques for the same command where usage patterns differ).

---

## 3. Direct inputs to B0

1. Primitive type system: **domain objects** (typed data + reified concepts: tokens, themes, selections, queries) / **instruments** (reified commands, polymorphic over object types) / **meta-instruments** (activation surfaces). Encodings (from the data pillar) are how object collections become perceivable; instruments attach to encodings.
2. Interactive-primitive contract schema = the five channels (action, reaction, command, response, feedback) + activation type (spatial/temporal) + the three property scores (indirection, integration, conformance).
3. Interactions specified as declarative state machines, independent of their targets — simultaneously the contract-as-data, the implementation spec, and the agent-consumable description.
4. Constraint system evaluates **compositions** (L8), including activation costs (L6) and temporal-offset budgets (L5).
5. Grammar acceptance criteria: reinterpretability, resilience, scalability (L7) — alongside the Table-derivation test from [dimension-a-purpose.md](./dimension-a-purpose.md) §9.
