# Universal Data Layer: Strategy Proposal
### From "Notion-like database" to a general ingest → type → detect → render pipeline

---

## 0. Framing

You're actually solving three separate problems that look like one:

1. **Type system** — what *kind* of value is this field? (primitive → semantic)
2. **Shape detection** — what *structure* does this dataset have as a whole? (tabular, tree, graph, geo, timeseries, feed)
3. **View rendering** — how do I *bind* a shape's fields to a visual encoding? (Table, Board, Timeline, Chart, Map, Graph, Dashboard)

Most Notion-clones collapse all three into "database properties → table, with some views bolted on." That's why they can do Kanban (it's just a table grouped by one column) but choke the moment you want a graph, a tree, or a map — those need *structural* awareness, not just column formatting.

This mirrors exactly what you did at FIS: the vendor JSON blobs weren't the problem, the *missing semantic layer between raw data and interpretation* was. Same shape here — the CSV/API payload is the vendor blob, and you need an interpretation layer before any view can render intelligently.

**Core architectural principle:** keep these three layers strictly separated, connected by explicit contracts, so a new view type doesn't require touching the type system, and a new type doesn't require touching every view.

```
Source Adapter → Primitive Types → Custom Types → Dataset Shape Detection → Encoding/Binding Layer → View Renderers
      (raw)         (per-field)      (semantic)         (structural)              (per-view contract)      (visual)
```

---

## 1. Layer 1 — Primitive Data Types

The atomic, storage-level type. Small, closed set — this is your "column can hold X" layer, roughly what Notion/Airtable expose today. Keep this deliberately boring; all the interesting behavior lives in Layer 2.

| Primitive | Notes |
|---|---|
| `string` | plain text |
| `richtext` | structured/markdown text (your page-block content) |
| `number` | with precision metadata |
| `boolean` | |
| `date` / `datetime` | store as ISO 8601 + timezone awareness |
| `enum` (single-select) | closed option set |
| `enum[]` (multi-select) | |
| `reference<DatabaseId>` | **typed** pointer to another Item in a specific Database (union targets `reference<DbA \| DbB>` possible later) — this is your relation type, and typing it is what makes self-reference detection for Tree/Graph trivial rather than heuristic (§3, §4) |
| `array<T>` | ordered list of any primitive |
| `object` | nested key/value, arbitrary JSON |
| `geopoint` | `{lat, lng}` — worth promoting to primitive rather than custom, because so much detection depends on it |
| `file` / `media` | |
| `url` | |
| `formula` | computed, references other properties |

Everything else (Money, Address, Person, Status-with-workflow, Rating, Duration, Percent, Tags-with-color) is a **custom type**, not a primitive. Resist the urge to grow this list — it's the thing every view renderer has to know about, so it should change rarely.

---

## 2. Layer 2 — Custom Data Types

This is your Feature Store vocabulary again: primitive value + **interpretation metadata**. A custom type = `{ base: primitive, validators, formatters, display rules, semantic tag }`.

Structure I'd propose:

```ts
type CustomType = {
  id: string;                    // "money", "person_ref", "status"
  base: PrimitiveType;           // what it's stored as
  validate?: (v) => boolean;
  format: (v, locale) => string; // how it renders as text
  render?: ComponentRef;         // how it renders as a widget (e.g. status pill, avatar)
  semanticTag?: SemanticTag;     // "currency" | "identity" | "temporal" | "categorical" | "spatial" | "quantitative"
  compatibleEncodings: EncodingChannel[]; // which chart channels can this bind to (see §5)
}
```

Examples:
- **Money** = `number` + currency code + locale-aware formatter + `semanticTag: quantitative` → can bind to chart y-axis, sum aggregation.
- **Status** = `enum` + color map + optional workflow transition rules → can bind to Kanban lanes, chart color/group.
- **PersonRef** = `reference` + avatar/name formatter + `semanticTag: identity` → can bind to graph node, feed author, board card assignee.
- **Address** = `object{street, city, ...}` + optional derived `geopoint` (lazy-geocoded) → unlocks map view *without* the user manually adding lat/lng.
- **Priority** = `enum` with ordinal ranking (not just categorical) → matters for sort/axis behavior, distinguishes it from Status.

**Why `semanticTag` matters:** it's the thing shape detection and view binding actually query against, not the raw primitive. "Quantitative vs categorical vs temporal vs spatial vs identity" is the classic Grammar-of-Graphics distinction (Vega-Lite, ggplot2 use exactly this) — borrow it directly rather than reinventing.

---

## 3. Layer 3 — Dataset Shape Detection

This is the genuinely hard, novel part of your system — and the part with no clean off-the-shelf answer, because it's fundamentally an ambiguous inference problem. Design it as **signal-scoring, not classification**: compute a confidence score per candidate shape, surface the top 1–2 to the user, let them confirm/override. Never silently auto-commit to a structural interpretation — get it wrong once (e.g. mislabels a self-referencing table as a tree) and the user loses trust in every future import.

### Candidate shapes & their detection signals

| Shape | Detection signals |
|---|---|
| **Tabular/Relational** (default) | No strong signal for anything else. This is the fallback — everything is at least this. |
| **Tree/Hierarchical** | With typed references, this collapses to a clean check: a `reference<thisDatabaseId>` field (self-reference by construction, no name/heuristic guessing needed) where the reachability graph is single-rooted and acyclic. Nested JSON with recursive structure is the fallback signal for non-relational sources (raw API payloads before they're mapped to typed references). |
| **Graph/Network** | Broader than Tree: *any* typed `reference` field seeds a Graph, self- or cross-database (e.g. Contacts→Companies is a valid bipartite graph). A self-reference specifically is Graph-eligible *and* Tree-eligible; detection scores which is the better default — single-rooted/acyclic → recommend Tree, multi-parent or cyclic → recommend Graph (Tree would render degenerate). |
| **Geospatial** | Explicit `geopoint` field, GeoJSON column, OR a resolvable `Address` custom type, OR field names matching `lat/lng/latitude/longitude/geo/coordinates` heuristically. |
| **Temporal/Timeseries** | A `datetime` field with high cardinality + roughly regular intervals, paired with ≥1 `quantitative` field. Distinguish from Feed by regularity of interval and presence of numeric metrics vs. free text. |
| **Feed/Stream** | `datetime`-sorted, append-only semantics (no natural primary sort other than time), dominant field is `richtext`/`string` rather than quantitative — i.e. "log of events/posts" rather than "log of measurements." |
| **Matrix/Cross-tab** | Two categorical (enum) fields + one quantitative field, with near-complete cartesian coverage (most category-pairs present). |

### Implementation approach

1. **Signature extraction pass** on import: per-field cardinality, uniqueness ratio, null ratio, self-reference detection, regex/name matching against a small dictionary (`lat`, `lng`, `parent`, `source`, `target`, `timestamp`...).
2. **Rule engine, not ML, to start.** This is a case where hand-written heuristics will outperform a model for a long time — the signals above are structural/statistical, not semantic pattern-matching that needs learning. Save ML for a v2 "smart suggestion" layer once you have real usage data to see what the rules get wrong.
3. **Score, don't decide.** Each candidate shape gets a 0–1 confidence. Show the user: "This looks like a Tree (parent_id detected, 94% connected) — also viewable as Table." Let them pin the interpretation; store it as dataset metadata (`detectedShape`, `confirmedShape`, `overrides`).
4. **Shape is additive, not exclusive.** A dataset with a detected Tree shape is *still* a valid Table — detection unlocks additional views, it never removes the default ones. This is important: never let a wrong shape guess break the baseline table view.
5. Re-run detection when schema changes (new field added, API response shape shifts) but don't silently flip an already-confirmed shape — flag it for re-confirmation instead.

---

## 4. Layer 4 — The Encoding/Binding Layer (the connective tissue)

This is the layer most systems skip, and it's the one that will save you the most future pain. Don't let view components reach directly into raw field types — insert an intermediate **encoding contract** per view type, à la Vega-Lite's `encoding: {x, y, color, size, ...}`.

```ts
type ViewDefinition = {
  type: "table" | "board" | "timeline" | "chart:bar" | "chart:line" | "map" | "graph" | "tree" | "feed" | "dashboard";
  requiredChannels: EncodingChannel[];   // e.g. Timeline needs {start: temporal, end?: temporal, lane?: categorical}
  optionalChannels: EncodingChannel[];
  filters, sort, grouping: ...
  channelBindings: Record<EncodingChannel, PropertyRef>; // user or auto-assigned
}
```

Each view type declares what it *needs* in terms of semantic tags, not concrete fields:

| View | Required channels | Optional |
|---|---|---|
| Table | none (works on any dataset) | column visibility, sort |
| Board (Kanban) | 1 categorical (lane) | secondary group, card fields |
| Timeline | 1 temporal (start), optional temporal (end) | lane (categorical), color |
| Chart (bar/line/scatter) | x: any, y: quantitative *or* a groupable field to `count()` | color, size, facet |
| Map | 1 spatial | color, size, cluster |
| Graph | ≥1 typed `reference` field, self or cross-database | node color/size by field |
| Tree | ≥1 typed **self**-reference (`reference<thisDatabaseId>`) | node color |
| Feed | 1 temporal + 1 identity/author + 1 text | media, reactions |
| Dashboard | composes other Views — not a per-Database eligibility check | layout grid |

**Auto-binding heuristic:** when a user switches a database into a new view, walk `compatibleEncodings` on each custom type and auto-fill the required channels with the best-scoring match (e.g. first `temporal`-tagged field → `start`), then let them remap manually. This is what makes the "just works" magic happen without hardcoding per-database logic.

This layer is also what makes **Dashboard** tractable: a Dashboard isn't a new rendering engine, it's a *composition* of already-defined Views (from possibly different Databases) laid out in a grid, each still going through the same binding pipeline.

### 4a. Eligibility vs. Recommendation — deciding which Views a Database can even offer

Two separate mechanisms, easy to conflate: **eligibility** (can this View render on this Database at all) and **recommendation** (should it be the suggested default). Shape detection confidence (§3) feeds *only* the second one — it should never be what gates whether a View shows up as an option.

**Eligibility is a live predicate, not documentation:** `isViewEligible(viewType, schema) → boolean`, computed off the required-channels table above, recomputed whenever a Property is added/removed/retyped. For each View, ask whether the schema contains at least one Property whose `semanticTag` (or, for Graph/Tree, reference *type*) satisfies each required channel.

Two nuances worth keeping explicit, since they're easy to get backwards:

- **Chart is almost always eligible, even with zero number fields** — `count()` over any categorical/reference Property is a synthesized quantitative channel ("Contacts by Company" needs no numeric column at all). Don't gate Chart as tightly as Timeline/Map.
- **Graph and Tree are not the same eligibility bar.** *Any* typed reference (self or cross-database) makes Graph eligible. Only a typed *self*-reference additionally makes Tree eligible. A Contacts Database with a `company: reference<Companies>` field is Graph-eligible (bipartite Contacts↔Companies) but **not** Tree-eligible — there's no self-reference to hang a tree on. Offering Tree there would just render empty; the eligibility check exists specifically to prevent that.

**Recommendation ranking** — which eligible View is suggested first / gets a "suggested" badge — is where shape-detection confidence comes back in: e.g. Board might outrank Timeline if a `status` field has clean, low-cardinality coverage, while `created_at` is just a flat point-in-time per Item with nothing to meaningfully group by.

Net effect: the table above is the *default channel requirements*, but the actual "which Views does this Database offer" decision at runtime is this live predicate, evaluated per-schema.

---

## 5. Layer 5 — The Notion-like Data Model (your existing plan, formalized)

You've already got the right shape — this just names the pieces precisely so the layers above have something to hook into:

- **Database** = a typed collection: schema (`Property[]`, each with a Custom Type) + source binding (manual, API, CSV). Shape *detection* runs at this level (it needs to scan all Items), but the confirmed shape *label* is **not** stored here — see below.
- **Item** = one row/record conforming to the Database schema.
- **Item → Page** = every Item can expand into a full page/canvas (your existing block-based page system) — the properties become a structured "frontmatter" region, the rest is freeform blocks. This is exactly Notion's model and it's the right one; nothing above changes it.
- **View** = a saved `ViewDefinition` (§4) over a Database — filters, sort, grouping, channel bindings, **and shape metadata** (`{ shape, confidence, signals, confirmedByUser }`) when that View consumes a structural interpretation. Multiple Views per Database, all independent lenses over the same Items — a Tasks Database can have a Table View *and* a Tree View simultaneously, each with its own confirmed shape state, without forcing one canonical interpretation on the Database itself. A View-level override ("treat this as Graph, not Tree") scopes to that View only; it doesn't force other Views built on the same Database to agree.
- **Source Binding** = how the Database's Items get populated:
  - `manual` — user enters directly.
  - `csv-import` — one-time or re-importable snapshot, with a field-mapping step (raw CSV column → schema Property, with type coercion/preview).
  - `api-connect` — recurring fetch (polling or webhook), same field-mapping concept, plus a sync strategy (upsert key, conflict resolution, delta vs. full refresh).

The field-mapping step (CSV column / JSON path → typed Property) is worth building as its own reusable component early — both CSV and API sources need it, and it's also where primitive-type inference-on-import happens (sniff the CSV, guess types, let user confirm — same "score, don't decide" pattern as shape detection).

---

## 5b. The Presentation/Appearance Layer

A fourth concern belongs on the Custom Type, alongside `base`, `validate`, `format`, `semanticTag`, `compatibleEncodings`: a **presentation contract**.

```ts
presentation: {
  archetype: "pill" | "avatar" | "progress" | "rating" | "sparkline" | "plain" | "badge";
  density: { compact: Component; standard: Component; expanded: Component }; // required, not optional
  colorStrategy?: "hash" | "manual" | "none";
}
```

**Appearance belongs to the Type, not the View.** "Select renders as a colored pill" is a *policy* attached to categorical data — the best-known pattern for scannable, low-cardinality values — not something each view (Table, Board, Filter) should reimplement independently. What legitimately varies per rendering context is **density**, not identity:

| Context | Density | Notes |
|---|---|---|
| Table cell | compact | truncated, minimal |
| Board card | standard | icon + label, room to breathe |
| Page property panel | expanded | full label, inline-editable |
| Filter/chip | compact, interactive | same visual style, removable (×) |
| Feed/timeline label | compact | often just a color dot |

Bounding every registered renderer to exactly three required density variants keeps this to **N types × 3**, not N types × M contexts.

**Two-tier config for option colors (the concrete Notion-tag question):**
- **Type-level (structural):** "Status is a pill" — defined once on the Custom Type.
- **Instance-level (data):** *this* Database's Status options and their specific colors — stored per-schema. Default via deterministic hash of the option string (zero setup), overridable and persisted once someone customizes it manually.

**Extensibility — appearance for a Custom Type nobody has explicitly registered yet:**
1. `semanticTag`-based generic fallback: unregistered `categorical` → generic pill; `quantitative` → right-aligned number; `identity` → avatar-if-image-else-initials badge; `spatial` → coordinate text + map glyph.
2. A type-authoring UI where a user defining a new Custom Type picks an archetype from a fixed library (the DS-AI atomic components, exposed as configuration) rather than writing a renderer.

**Reference implementation:** the existing Relative Time component already follows this shape and is worth treating as the template — three-format model = density variants; tense-by-time-bucket matrix = value→variant mapping logic; atomic sub-components = the registrable renderer contract. The known accessibility gap (`<time datetime>`) argues for enforcing a11y once at the **Component Registry** level, wrapping every registered renderer centrally, rather than trusting each future Custom Type to remember it individually.

Full pipeline with this layer inserted:

```
Custom Type (semantic) → Presentation Contract (archetype + density) → Component Registry → View renders via context lookup
```

---

## 6. Prior Art Worth Studying

You're not starting from zero conceptually — several systems have solved adjacent slices well:

- **Vega-Lite / ggplot2 grammar of graphics** — the `mark + encoding` separation is the single best reference for Layer 4. This is the most directly reusable idea in this whole proposal.
- **Cube.dev / Superset "semantic layer"** — literally the same problem you solved at FIS, applied to BI. Worth a direct comparison against your Feature Store metaschema — you may find you already invented 70% of this.
- **RAWGraphs** — open-source tool whose entire premise is "detect what chart shapes are valid for this dataset" — good reference for a shape→view compatibility matrix UI.
- **Flourish** — auto-suggests chart type from uploaded data shape; good UX reference for the "score, don't decide" confirmation pattern.
- **Kepler.gl / deck.gl** — geospatial detection and layered map rendering, if you go deep on the Map view.
- **Notion / Airtable** — your closest structural relatives for the Database/Item/View/Page model; study Airtable's field-type system specifically, it's more rigorous than Notion's.
- **GraphQL + Relay connection model** — good reference for how to represent graph-shaped data (nodes/edges) generically once detected.
- **Observable Plot** — a lighter-weight, more composable alternative to Vega-Lite if you want something easier to embed than to configure.

---

## 7. Phased Build Roadmap

Sequencing matters here — each phase should be independently useful, and later phases shouldn't require rewriting earlier ones because the layer boundaries above are load-bearing from day one.

1. **Foundation** — Primitive types + basic Database/Item/Page model + Table view + manual entry + CSV import with field mapping. (No shape detection yet — everything defaults to Table.)
2. **Semantic layer** — Custom Types on top of primitives (Money, Status, PersonRef, Address, Priority...) with formatters/validators. This alone dramatically improves the Table view (proper rendering, not raw values) before you've built a single new view type.
3. **Encoding layer + 2nd/3rd views** — Build the `ViewDefinition`/channel-binding abstraction (§4) using Board and Timeline as the first two non-Table views — both are structurally simple (single categorical / single temporal channel) and will validate the abstraction before you invest in Chart/Map/Graph.
4. **Chart views** — Bar/line/scatter, using the same encoding layer. This is where the quantitative/categorical/temporal semantic tags start earning their keep.
5. **API source binding** — Recurring fetch + sync strategy, reusing the field-mapping component from CSV import.
6. **Shape detection engine** — Signature extraction + rule-based scoring (§3), starting with just Geospatial and Tree (cheapest signals, clearest payoff) before tackling Graph (hardest to get right, most rule-engine complexity) and Feed (mostly a UX distinction from Timeline, not a hard detection problem).
7. **Map, Tree, Graph views** — unlocked by #6, consuming the same encoding layer as everything else.
8. **Dashboard** — composition layer over already-existing Views across Databases; should be close to "free" if §4 was built correctly, since it's layout + multi-view embedding rather than a new rendering engine.

---

## 8. Foundational Decisions — Resolved

These were flagged as expensive-to-reverse; each is now settled and reflected in the layers above.

**1. Shape metadata lives on the View, not the Database.** Detection *runs* at the Database level (needs to scan all Items), but the confirmed interpretation — confidence score, signals, confirmation state — is stored per-View. A Database can offer a Table View and a Tree View simultaneously over the same Items, each with independent shape state; a View-level override doesn't force other Views to agree. See §5.

**2. References are typed: `reference<DatabaseId>`.** Makes self-reference detection a direct equality check (`targetDatabaseId === thisDatabaseId`) instead of name/heuristic guessing, and is what makes the Graph-vs-Tree eligibility split in §4a possible. Open follow-on, not blocking: whether to support union targets (`reference<DbA | DbB>`) for fields that can point to more than one Database — real pattern (Notion's relation property allows it), revisit when a concrete case demands it. See §1.

**3. Formula/computed Properties participate fully** in shape detection and encoding — a computed `days_open` is a legitimate temporal channel for Timeline/Chart, no Table-only restriction. See §1, §4.

**4. Sync/versioning uses field-level provenance, not item-level.** Each field on a synced Item tracks `{ value, source, lastSyncedAt, lastEditedAt, dirty }`, with a per-Property sync policy configured at field-mapping time:

| Policy | Behavior | Good for |
|---|---|---|
| `source-wins` | always overwrite with incoming value | fields reflecting external reality (e.g. GitHub `state`) |
| `local-wins` | never overwrite once user has touched it | fields the API seeds once but the user then owns |
| `flag-conflict` | both source and local changed since last sync → surface for review, don't auto-pick | high-stakes fields |
| *(unmapped)* | not bound to source at all | purely local fields, no conflict possible by construction |

Two sync-event types are handled differently by severity:
- **Value changes** are routine, resolved by the policy table above per-field.
- **Shape changes** (API adds/drops a field, or a field's type flips) are a schema-migration event, never auto-applied — detect the delta and *propose* the change (new Property suggested, orphaned Property flagged, type conflict flagged), same "score, don't decide" pattern as §3.

Computed Properties are excluded from sync-mapping by construction (they're derived, never a sync target), so no conflict is possible there — the only related concern is cache staleness on expensive cached aggregations, which is a recompute/invalidate problem, not a merge-conflict one.

Worked walkthrough (GitHub Issues Database, synced via API): new issue → clean insert on upsert key, no conflict. Issue closed upstream, untouched locally → clean overwrite (`dirty=false`). Issue where the user relabeled `status` locally, then a sync arrives with a different upstream state → `dirty=true`, policy decides (`local-wins` keeps the user's label; `flag-conflict` surfaces it). New unmapped API field (`labels[]`) → shape-change event, proposed as a new Property, not auto-added. Issue that disappears from the latest API response → marked `sourceDeleted`/stale rather than hard-deleted, especially if the Item has an authored Page — user decides to detach-and-keep or delete.