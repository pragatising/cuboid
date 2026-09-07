# Component backlog

Source of truth for what's designed in Figma but not yet (or only partly) built in Cuboid. One file, tracked in git — update it as components move through stages rather than starting a new doc per session.

Figma file: `zOabpawUgebUI45IulHZUP` ("[DS] Cuboid"). Node IDs below are `page:node` from that file — open with `https://www.figma.com/design/zOabpawUgebUI45IulHZUP/--DS---Cuboid?node-id=<page>-<node>`.

## How to use this doc

- **Stage** moves left→right as work happens: `Spec review` → `Ready` → `In progress` → `Shipped`.
- Don't delete a shipped row — move it to the Shipped section with the version it landed in, so `git blame`/history stays a real record.
- If a Figma frame's scope is ambiguous (multiple unrelated components sharing one canvas, or a build-vs-buy question), say so in Notes rather than guessing — flag it for a design conversation instead of assuming.

---

## Greenfield (nothing built yet)

| Component | Figma node | What's there | Notes |
|---|---|---|---|
| Avatar | `2005:1919` | Avatar (shade × style[text/icon] × size[sm/md/lg]), Avatar.States (user/no-user × rest/hover/clicked), AvatarStack (1/2/3/+3/0), Avatar.HiddenUsers (overflow count), Avatar.AddUserButton | Five sub-parts bundled in one canvas — treat as one component with a compound API (`Avatar`, `AvatarStack`, `AvatarGroup` overflow), not five separate components. |
| Checkbox | `10362:94789` | Checkbox (focused states), Checkbox.States (checked/unchecked/mixed × rest/hover/disabled/error), Checkbox.Icon (box/check/indeterminate × enabled/disabled), CheckboxGroup | Has a real mixed/indeterminate state — needs a 3-state model, not boolean. |
| Dialogue | `2484:2462` | Single `Dialog` symbol | **Confirmed not redundant** — `Sheet` is edge-anchored only (left/right/bottom slide-in), `Popover` is anchored to a trigger element; neither renders a centered card. Evidence: the portfolio app (`src/components/layout/Sidebar/{NamePromptDialog,ConfirmDialog}.tsx`, and a new `SettingsDialog.tsx`) has hand-rolled the identical `Overlay` + `Box` + `createPortal` centered-card shell three separate times because there's nothing to reach for. Real gap — worth building as a proper `Dialog` primitive (header/body/footer slots, focus trap, Escape/outside-click dismiss, sizing) and back-porting those three call sites onto it once built. **Ask before building** (per portfolio's `ask-before-cuboid-changes.mdc`) — flagging the gap here, not starting the build. |
| Datepicker | `10365:95747` | DatePicker.Date (rest/hover/disabled/selected), DatePicker.Date.Text, Datepicker (Month view / Year view) | Building-blocks canvas suggests calendar grid + text-entry variants both exist in the design. Sizeable — month/year navigation, date-cell states, likely needs a `Popover` pairing (already exists) for the trigger. |
| Radio (native + button) + Card + Button | `10569:93678` | InputRadioNative, Input.RadioNative.States (rest/hover/disabled/error × selected), Input.RadioButton (pill-style), Input.RadioButtonStates (× styleInverted), InputRadioNativeGroup (stacked/inline), Input.RadioButtonGroup (text/icon × styleInverted) | Despite the node title ("Radio Input, Card, Button"), the canvas is entirely radio-family — no separate Card/Button content found. Two visual styles (native radio dot, and a button/pill-style radio) — confirm both are wanted or if one supersedes the other. |
| Toggle Switch | `10569:95812` | ToggleSwitch (active/inactive), ToggleSwitch.Icon (switch × rest/hover/disabled) | Straightforward — on/off + hover/disabled states, optional icon variant. |
| Relative Time | `2004:11345` | Date&Action, size=sm/md | Small — likely a `<Text>`-wrapping component that formats a timestamp as "3h ago" style, two sizes. |
| Toast | `10654:89620` | Toast (neutral/warning/success/error/dark) | Five semantic states. Check for an existing toast-manager/portal pattern needed (stacking, auto-dismiss) — that's an interaction-layer decision beyond the visual component. |
| KeyValue | `2008:1640` | KeyValue.Data (11 content combinations: text, text+icon, waiting, highlighted, text+pill, enum+link, date, button, enum, multi-enum, empty), Keys (7 width presets: auto/sm/md/lg/xl/xxl/fill), KeyValuePair (row/json/fields layout styles), List.KeyValue (flat + nested) | Largest greenfield item after Table. 11 content-type variants is effectively a small type system of its own (text/date/enum/link/button/empty/...) — this will want a discriminated-union content prop, not 11 separate components. |
| Smart Link | `209:2435` | Smartlink (rest/hover) | **Stub directory already exists** at `src/components/core/Smartlink/` but is empty — no `.tsx` file yet. Simple two-state component; smallest real gap to close. |
| Split Button | `12559:134777` | SplitButton (single symbol on a doc/demo page) | Only one variant surfaced in metadata — likely primary-action + dropdown-caret split, pairs with existing `Button`/`ActionMenu`. Worth a `get_design_context` pass before building since the metadata here is thin (mostly page-annotation frames, not variant states). |
| Spinner | `10006:76575` | Spinner (sizes: 120px/80px/24px/20px/16px, all thickness=2px) | Pure loading indicator, five fixed sizes. Small, low-risk build. |
| Skeleton | `2136:9379` | Skeleton (rectangular/circle shapes), Skeleton.Animated (2 animation states) | Placeholder-loading blocks + a pulse/shimmer animation state. |
| Accordion | `2449:7750` | AccordionButton (rest/hover × open/closed), Accordion (open/closed content states) | Standard disclosure pattern — trigger + collapsible region. |
| Tabs | `10001:76300` | Tab.Primary (rest/hover/focus × active), Tab.Secondary (same), Tab List (primary/secondary), Tab List VERTICAL [EXPERIMENTAL] | Two visual tiers (primary/secondary) plus an explicitly-marked experimental vertical layout — build primary+secondary first, treat vertical as a later follow-up per the "[EXPERIMENTAL]" tag in the frame name itself. |
| Advance Query Chip | `296:1236` | AdvanceQueryChip (rest/pressed × expression/complete states), QueryChip.InputSelect.Value, Operator (equals/not-equals/less-than-equal/greater-than/contains), Operator.Types (numeric-string/boolean), FilterDropdown.Content, Values (multi-select/text-area/number/date) | **By far the largest, most system-like item in this list** — this isn't one component, it's a filter-builder subsystem (chip + operator picker + type-aware value input + dropdown). Needs its own scoping conversation before estimating — don't treat as a single backlog row once work starts. |
| Banners | `10006:76403` | Banner (type=neutral/info/success/warning/error), a second Banner frame with alternate type naming (neutral/info/positive/attention/error) | Two frames with slightly different type vocabularies for what looks like the same component — reconcile naming before building (five semantic states either way). |
| Counter | `2093:348` | Single `Count` symbol | Smallest item in the whole list — likely a numeric badge (e.g. unread-count). Trivial build once padding/sizing tokens are confirmed. |
| Input Text (+ Select, Text Area) | `10006:76283` | Very large doc/demo canvas — "Input Text" title, includes Input Text, Input Text Area, Input Select instances across multiple annotated slides. Metadata exceeded normal fetch size (mostly annotation/marker frames, not clean variant symbols). | Needs a dedicated `get_design_context` pass (not just metadata) before scoping — this is the InputField family referenced earlier this session as the motivating case for the Stack/Box `spaceScale` padding work. Likely covers text input, textarea, and select as one family, each with rest/hover/focus/disabled/error states. |

## Partial — extends an existing component

| Component | Figma node | Current cuboid state | Gap |
|---|---|---|---|
| Table & Grid | `10006:76590` | `src/components/core/Table/Table.tsx` — structural primitives plus opt-in sortable `SimpleTable<TData>` headers, density (dense/spacious), and line style (none/rows/grid). | Figma frame (explicitly noted by user as "editable with a lot more features") still specifies 16 cell content types (text, date, label, loading, icon, bar graph, donut chart, checkbox, **inline input**, avatar+name, avatar stack, text+label, empty, smartlink, link+label, switch), truncated-cell tooltip pattern, row-open button, and pagination. Sort is now the first shipped slice; continue as a mini-roadmap with cell types first, then pagination. |

---

## API improvements (shipped components, not new builds)

| Item | Current state | Proposed | Notes |
|---|---|---|---|
| Icon by name | `Icon` (`src/components/core/Icon/Icon.tsx`) only takes a `children: React.ReactElement` — callers must import the specific icon component (`AddIcon`, `DeleteIcon`, ...) from `src/icons/material/index.ts`'s ~226 named exports and pass it as a child, e.g. `<Icon size="md"><DeleteIcon /></Icon>`. `IconButton` likewise only accepts a pre-built icon element as `children`, no name-based prop. | `<Icon name="add" size="2x" color="..." />` — a string `name` prop that resolves to the right icon internally (lookup table keyed by the same names already used for the individual exports, e.g. `"add"` → `Add` source glyph), so callers don't need a per-icon import. `IconButton` gets the equivalent `icon="add"` (or nested `<Icon name="add" />` child, whichever comes out of the design conversation) instead of requiring `children` to already be an icon element. | Raised from the portfolio app: consumers were re-wrapping Cuboid source glyphs locally (`portfolio/src/lib/icons.ts`) partly because importing-by-name felt like the natural API and the current one wasn't discovered/used consistently — most of those local wrappers turned out to duplicate icons Cuboid already exports under the same names, but the friction of "which of 226 exports do I import" was real. A name-based prop would also make it easier to add a weight/optical-size axis later (Material Symbols exposes both) without changing every call site. Needs a design decision on the lookup mechanism (string-keyed object of all 226, versus keeping the current tree-shakeable named-export pattern as the primary API and adding `name` as a convenience layer on top) — tree-shaking is the main tradeoff to weigh before building. |

## Shipped

_(nothing from this backlog yet — this section fills in as items move here, with the version they landed in, e.g. "Pill border overrides — 0.1.9")_
