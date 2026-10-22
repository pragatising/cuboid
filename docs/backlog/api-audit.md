# Component API audit

Cross-cutting audit of the public API of every exported component in `packages/react`, from the point of view of a developer using it, an LLM writing code against it, and a maintainer keeping it consistent. Done 2026-10-21, after the whole library was migrated to `useTokens()` and Box was made CSS-complete. Per-component gaps found while migrating live in `packages/react/docs/component-audit.md`; this file is about patterns *across* components.

Evidence comes from the type checker (own props of every export, with JSDoc), not from memory; `packages/react/scripts/dump-props.mjs` regenerates it. Criteria come from the request (prop names that match CSS expectations, discovery for people and LLMs, consistency, state management) and from the repo's own rules in `packages/react/docs/style.md`, `component-content-api-pattern.md` and `behaviours.md`.

**Why now:** the portfolio app (~60 import sites) has to be migrated off the old API anyway. Every breaking change below costs the same once, so this is the cheapest moment to make them.

---

## Verdict

The *shape* is good and consistent where it was built recently: Box, Text, Heading, Subtitle, Link, Pill, Icon, Button and IconButton share `size`/`color`/`as`/`ref`, spread rest props to the root, and name their anatomy with `data-component`. The problems are a handful of **vocabulary collisions** (same word, different meaning), **four hand-rolled copies of open/collapse state**, **a root-element contract that the "big" components skip**, and **no machine-readable description of any of it**. None is large; together they are what makes the API feel guessable in some places and not in others.

Numbers: 40 exported components; 211 own props (excluding Box, `children`, `className`, `as`); **56 (27%) have no JSDoc**; 9 components cannot take `ref`, `style` or rest props.

---

## 1. Vocabulary collisions (names that mean something else than CSS or than each other)

These are the highest-value fixes: a developer (or model) who knows CSS will guess wrong.

| # | Where | Today | Problem | Proposal |
|---|---|---|---|---|
| 1.1 | `Button.alignContent` | `"start" \| "center"` | CSS `align-content` is a different property, and Box now takes the real one | `contentAlign`? or `align`; decide with Button's `block` |
| 1.2 | `Container.width` | `"page" \| "content" \| "full"` | It sets **max-width**; Box's `width` is a length | `maxWidth` taking the named stops (and any Length) |
| 1.3 | `Pill.border` | boolean | CSS/Box `border` is a border value | `bordered` (or `surface="bordered"`) |
| 1.4 | `color` | fg token path (Text, Heading, Subtitle, Icon, Link, Box) **but** `DividerColor` keys on Divider and `HighlightColor` keys on Highlight; Pill uses `shade`; Callout `backgroundColor` | One word, three vocabularies | `color` = foreground colour everywhere (token or CSS). Divider → `color` taking a `borderColor` path. Highlight's palette is a background tint: `backgroundColor`-like, or `tone`. Pill keeps `shade` + `intensity` (a two-axis palette) |
| 1.5 | `variant` | Button/IconButton: the look. Link: a *context* (inline/standalone/inherit). Overlay: scrim strength | Overloaded | Link → `inline` boolean (Primer does this) plus `underline`; Overlay → `tone`/keep as is; Button keeps `variant` |
| 1.6 | `edge` / `orientation` | Sheet `left\|right\|bottom`, Sidebar `left\|right`, ResizeHandle `start\|end\|top\|bottom` + `orientation` | Physical vs logical; breaks in RTL | `start \| end \| top \| bottom` (logical) everywhere, `orientation` dropped or renamed `axis` |
| 1.7 | `Popover.elevation` | `"3x" \| "4x"` | A Figma name; the tokens are `shadow.floating.sm\|md\|lg` | `"sm" \| "md" \| "lg"` |
| 1.8 | `Tooltip.compact` | boolean | Means "single line with an ellipsis"; Text calls that `truncate` | `truncate` |
| 1.9 | `Table.rowLayout` | `wrap \| truncate \| fixed` | Overlaps Text's `truncate`/`whiteSpace` | align with `whiteSpace`/`truncate` vocabulary |
| 1.10 | Exports in CodeBlock | `JsonViewer` (placeholder, table/code toggle) **and** `JsonCodeView` (the real one, exported from CodeBlock) **and** `CodeSnippet` (deprecated alias) | Two things called a JSON viewer | Delete `CodeSnippet`; rename the placeholder or fold it in |

**Not a problem:** `size` is `sm|md|lg` (plus `xs` where a control has it) everywhere it exists; `disabled`/`inactive`/`loading` are consistent on Button and IconButton; booleans are unprefixed; callbacks are `onX`.

## 2. State management (the biggest structural finding)

`style.md` says to use `useControllableState`. **There is none in the repo.** Four components hand-roll controlled/uncontrolled state, each slightly differently:

| Component | Pattern | Quirk |
|---|---|---|
| Popover, ActionMenu | `open !== undefined` is "controlled", internal state otherwise | no `defaultOpen` |
| Sidebar | `collapsed ?? internal`, with `defaultCollapsed` | `undefined` vs controlled handled differently from Popover |
| SimpleTable | `sorting ?? internal` | no `defaultSorting`; the handler runs in both modes |
| CodeSurface | `watchlist` / `defaultWatchlist` / `onWatchlistChange` | the only one with the full trio |

And **the "went away" event has four names**: `Overlay.onDismiss`, `Sheet.onDismiss`, `Popover.onOpenChange` (plus `onClose` for its header button), `ActionMenu.onOpenChange`, `Sidebar.onCollapsedChange`.

**Proposal: one contract for everything that opens, collapses or selects:** `x` / `defaultX` / `onXChange(value)`.
- Implement `useControllableState` once (the style guide's own recommendation) and use it in all four.
- Sheet gets `open`/`defaultOpen`/`onOpenChange(open)` instead of `onDismiss`. Overlay is a scrim, not an opening thing: keep `onDismiss` there.
- Popover drops `onClose` (its header close button calls `onOpenChange(false)`).

**Duplicated behaviour** (the repo's `behaviours.md` says to extract hooks): Escape-to-dismiss in Overlay, Sheet, Popover and ActionMenu; resize clamp and delta in Sheet and Sidebar; anchored positioning (`computeFixedPosition`) in Tooltip and Popover; outside-click in Popover. Proposed hooks: `useControllableState`, `useEscape`/`useDismiss`, `useAnchoredPosition`, `useResizable`. All of these are covered by tests, so extraction is safe.

## 3. The root-element contract

`style.md`: rest props go to the root; `className`, `style`, `ref` always work. Met by Box, Text, Heading, Subtitle, Divider, Callout, Highlight, Pill, Link, Icon, Button, IconButton, Overlay, Sheet, ResizeHandle, Sidebar (all parts), SplitLayout, Container, Table parts, BreadcrumbLink, Breadcrumbs, SiteHeader, ActionMenuList/Item.

**Not met (cannot take `ref`, `style` or rest props):** SimpleTable (only `className`, `tableClassName`), Popover (`className` goes to the anchor span, not the panel; `panelRef` instead of `ref`), ActionMenu (`className`, `listClassName`), CodeSurface, CodeBlock, JsonCodeView, ApiResponseViewer, DataGrid and JsonViewer (placeholders).

**Class-name proliferation** is the symptom: `contentClassName`, `listClassName`, `tableClassName`, `panelRef`. Rule proposal: `className`/`style`/`ref`/rest always mean the root; parts are reached through compound components (`Popover.Panel`) or `data-component` selectors, not extra `*ClassName` props.

## 4. Slots and content

| Today | Used by |
|---|---|
| `leadingVisual` / `trailingVisual` | Button, Pill, Sidebar.Item |
| `leadingIcon` / `trailingIcon` / `subtextIcon` | ActionMenuItem |
| `icon` | IconButton |
| `leading` / `trailing` (whole regions) | SiteHeader |
| `header` / `footer` props | Popover |
| `Header` / `Body` parts | Sheet, Sidebar, ActionMenuList |

Proposal: visuals are always `leadingVisual`/`trailingVisual` (ActionMenuItem renamed; `subtext` → `description`); regions are compound parts or `leading`/`trailing`; Popover's `header`/`footer` become `Popover.Header`/`Popover.Footer` (it already reuses ActionMenuList's).

**Children vs data** (per `component-content-api-pattern.md`): the data form is right for CodeSurface (`lines`, virtualised) and fine for Table (it offers both: the "spectrum of abstraction" the style guide wants). **Breadcrumbs `items` is the odd one**: it can't take an icon, a router link (`as`) or a current marker per item, which the compound components next to it all can. Add `Breadcrumbs.Item`, keep `items` as the shorthand.

## 5. Sizes and dimensions off the token scale

Box and Container take `Length` (Nx scale or any CSS length). Everything else takes a raw string or a named stop only:
- `height` / `maxHeight`: CodeSurface, CodeBlock, JsonCodeView (`string`); `maxHeight`: Popover, ActionMenu (`string`)
- `width`: Sheet and Sidebar (a named stop or a CSS string, no Nx steps)
- `bodyPadding`: Popover (`Space`, not raw), Container `paddingInline`/`paddingBlock` (`Space | false`)

Proposal: all of these become `Length` / `SpaceValue`, matching the principle "a token is a shortcut, not a fence".

## 6. Do non-Box primitives accept CSS props?

No. `<Text textAlign="center">` is a type error; Text dropped `align` and the others never had it. Only `style`. Box now takes every CSS property, so the question is whether Text, Heading, Subtitle, Link, Icon, Divider, Pill and Callout should too.

Options: **(a)** keep them narrow and tell people to wrap in Box; **(b)** extract Box's prop splitting (`splitProps`) into a shared `useCssProps` and let every primitive accept the same props; **(c)** (b), but a curated subset per component (typography props on Text, box-model props on Callout). I'd choose (b) for the "any primitive" rule you stated, with the cost that every primitive's prop type grows to ~850 entries (check editor performance first). **Needs a decision.**

## 7. Prop discovery (for people and for LLMs)

- **JSDoc:** 56 of 211 own props undocumented. Worst: Popover (7 of 21), CodeSurface (7), ActionMenu (5), ActionMenuItem (5), ApiResponseViewer (4), CodeBlock/JsonCodeView (4 each). Button, Text, Link, Box, Sidebar, IconButton are well documented.
- **No machine-readable description.** The `ActionMenu.docs.json` / `.figma.tsx` placeholders are empty. There is nothing a docs UI, an `llms.txt`, or a model can read to learn a component's props, defaults, states, anatomy (`data-component` parts), the token group it reads, or its a11y requirement.
- **Anatomy is documented for Button only.**
- **Dev-time warnings** only on Button/IconButton; nothing for an unnamed Sidebar, Sheet or Popover.
- **Good already:** errors name the offending value (Box, Space, colours); string-literal unions instead of magic numbers; `data-component` on every part; prop types live next to the component (Button's `types.ts` family file).

**Proposal: generate `components.json` from the types** (the props-extraction step the docs-shell experiment already needs): per component, every prop (type, default, JSDoc), `as`, states, anatomy parts, token group, a11y requirement. It feeds (1) the Properties panel in the docs shell, (2) an `llms.txt`, (3) a CI check that fails on an undocumented prop or a prop name outside the dictionary below. `scripts/dump-props.mjs` is the working seed.

**A canonical prop dictionary** (what each word means, library-wide) is the cheapest thing that makes the API predictable to a model:

| Concept | Name | Notes |
|---|---|---|
| element | `as`, `ref`, `className`, `style` | root only |
| scale | `size`: `xs?`, `sm`, `md`, `lg` | |
| look | `variant` (Button family), `shade` + `intensity` (Pill) | not for context |
| colour | `color` (foreground), `backgroundColor`, `borderColor` | token or CSS |
| state | `disabled`, `inactive`, `loading`, `selected` (toggle), `current` (page) | each documented with its ARIA mapping |
| open/collapse/selection | `x`, `defaultX`, `onXChange(value)` | |
| content | `children`, `leadingVisual`, `trailingVisual`, `icon` (icon-only), `description` | |
| positioning | `placement`, `edge: start \| end \| top \| bottom` | logical |
| a11y name | `aria-label` **or** `aria-labelledby` | required by type on dialog/nav/icon-only |

## 8. Accessibility (measured, 2026-10-21)

Method: **axe-core run in real Chrome against all 166 stories in light and dark (332 runs)**, plus scripted keyboard probes of the interactive widgets (Sheet, Popover, ActionMenu, Tooltip, ResizeHandle, collapsed Sidebar, external Link). jsdom cannot see colour contrast, computed styles or focus order, which is why the per-component `expectNoAxeViolations` tests passed while real problems exist (they run with the contrast rule off). 195 of 332 runs had findings: 169 colour contrast, 8 scrollable-region, 2 aria-allowed-attr, and a few story-only issues. The sweep scripts are in the session scratchpad; adding them to the repo as `scripts/a11y-sweep.mjs` (devDependencies `playwright-core`, `axe-core`) so this runs in CI is part of the plan.

### 8.1 Token-level contrast failures (the biggest finding)

The design system's own palette fails WCAG AA (4.5:1 for text under 24px) in places components rely on. Dark mode is generated to match light's contrast, so it mirrors every failure (same ratios). These are token decisions, so they need a designer, not a code patch.

| Token (light) | Value | Ratio | Where it shows up | Needs |
|---|---|---|---|---|
| `fgColor.neutral.muted` (also `actionMenu.item.fgColor.rest`, `.subtext`, `breadcrumb.link.fgColor.rest`, code comments) | `#888783` | **3.59** on white, 3.41 on `canvas.inset`, 3.1 on `insetStrong` | Every Sidebar nav item at rest, every Breadcrumb link, all "muted" text, ActionMenu rows | ≥ 4.5 on the *darkest surface it sits on*; about `#6a6a67`, which is nearly `neutral.default` (`#6f6f6d`, 4.3 on `insetStrong`), so **muted and default need re-spacing**, not a nudge |
| Syntax colours on the code surface (`#f9f9f8`) | string `#ef6262` 3.0, number `#3a80f9` 3.5, keyword `#1b899e` 3.9, type `#8c53f4` 4.3, attribute `#f2711b` 2.8, css value `#c85700` 4.1, function `#afafff` 1.9, URL `#6565fa` 4.2, null `#e2e1dd` 1.2 | 1.2 to 4.4 | CodeBlock, JsonCodeView, ApiResponseViewer | a darker light-mode syntax set (editors ship AA themes) |
| Pill palettes (`pill.color.*`) | e.g. orange `#f2711b` on its tint 2.3, green `#87c875` on its tint 1.7, white on `bold` fills 1.7 to 2.9 | 1.7 to 2.9 | Pill, status/method pills in ApiResponseViewer | per-shade AA pairs; some `bold` fills need dark text instead of white |
| `fgColor.danger/critical/error.strong`, `bgColor.*.strong` red | `#e74646` | **3.91** (white on red and red on white) | danger Button, Heading colours, error text | darker red (already logged in the tracker) |
| `fgColor.success.strong` | `#5ca647` | 2.99 on white | success text | darker green |
| `fgColor.neutral.subtle` / `link.hover` | `#aba9a5` | 2.34 | Highlight `none`, hover colours | fine for *disabled*, not for text that is read |

Everything else in the sweep's contrast list is one of these tokens appearing in a story. **Disabled** controls are exempt by WCAG, so `neutral.subtle`/`disabled` are acceptable there only.

### 8.2 Component bugs (code, not tokens)

| # | Component | Finding (measured) | WCAG | Fix (behaviour) |
|---|---|---|---|---|
| 1 | **ActionMenuItem** | `role="menuitem"` with `aria-checked` (axe: aria-allowed-attr, **critical**) | 4.1.2 | `menuitemradio`/`menuitemcheckbox` when selectable; `aria-checked` only on those |
| 2 | **Sheet** (modal) | `aria-modal="true"`, but focus **stays on the trigger** when it opens, and **is not trapped**: five Tabs walk out of the dialog to the page behind it | 2.4.3, 2.1.2, dialog pattern | `useFocusTrap` + initial focus + focus return on close (Escape and the scrim already work) |
| 3 | **Popover** (`role="dialog"`) | Focus stays on the trigger; Escape returns it (only because it never left) | dialog pattern | decide: popover as a *disclosure* (no dialog role) or a non-modal dialog that moves focus in; either way via one behaviour |
| 4 | **ResizeHandle** | A plain `<button>` with no role, no value, and **arrow keys do nothing**; a keyboard user cannot resize Sidebar or Sheet. Hit area is 8px | 2.1.1, 4.1.2, 2.5.8 | window-splitter pattern: `role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, arrow/Home/End, `useResizable` handles pointer and keys |
| 5 | **Tooltip** | `pointer-events: none`: the tip vanishes if you move onto it | 1.4.13 (hoverable) | keep it open while hovered; stays dismissible with Escape (already) |
| 6 | **CodeSurface** scroll region | scrollable `div` with no keyboard access (axe: scrollable-region-focusable, serious) | 2.1.1 | `tabIndex={0}` on the scroller (it already has a labelled region) |
| 7 | **Table** | no focusable scroll container when wider than its box (not triggered in stories; the same bug waiting), and no way to give the table an accessible name | 2.1.1, 1.3.1 | scroll container `tabIndex={0}` + `role="region"` + name when it overflows; `caption` / `aria-label` prop |
| 8 | **Link** `external` | Name is correct ("Documentation": the glyph is hidden) but nothing says it opens a new tab | 3.2.5 (advisory) | visually hidden "(opens in a new tab)" |
| 9 | **Sheet/Sidebar** transitions | `transition: width/transform` ignores `prefers-reduced-motion` (Spinner already honours it) | 2.3.3 | one reduced-motion rule |
| 10 | **Sidebar, Sheet, Popover, Table** | accessible name optional, no warning | 4.1.2 | IconButton's `aria-label`-or-`aria-labelledby` union + dev warning |
| 11 | **Stories** (not components) | Breadcrumbs "Levels" has three `<nav>` with the same name; Heading "level is independent of size" jumps h1→h4; Divider "list rows" has a non-`li` child in a `ul` | 1.3.1 | fix the stories so the sweep is clean |

### 8.3 Verified OK (measured)

Sidebar: `navigation "Components"` with named `group`s and links, toggle has `aria-expanded`, collapsed rail keeps names ("Home", "Inbox", "Settings") and `aria-current`. ActionMenu: ArrowDown from the trigger opens and focuses the first item, Arrow keys, Home, End (skips disabled), Escape closes and returns focus, Enter opens. Popover: `aria-expanded`, `aria-haspopup`, `aria-controls` on the trigger. Tooltip: shows on focus as well as hover, Escape dismisses. Button/IconButton: loading is announced, inactive stays focusable, `aria-pressed` on toggles, icon-only needs a name (type-level). Table: `aria-sort` and named sort buttons. Focus ring (`#236ae5`) passes 3:1 on light surfaces.

### 8.4 Per-component scorecard

Legend: ✓ verified fine · ✗ finding above (number) · — not applicable.

| Component | Keyboard | Name/role/state | Focus mgmt | Contrast | Notes |
|---|---|---|---|---|---|
| Box, Text, Heading, Subtitle, Divider, Container, SplitLayout, Callout, SiteHeader | — | ✓ | — | ✗ 8.1 (muted/status colours) | semantics are the consumer's choice (`as`) |
| Highlight | — | ✓ `<mark>` | — | ✗ `none` tint | |
| Icon | — | ✓ decorative unless `label` | — | follows parent | |
| Pill | — | ✓ | — | ✗ 8.1 palettes | |
| Link | ✓ | ✓ | ✓ | ✗ rest/hover | ✗ 8 |
| Button, IconButton | ✓ | ✓ | ✓ | ✗ danger/primary pairs | |
| Breadcrumbs | ✓ | ✓ `aria-current` | — | ✗ link rest (muted) | story ✗ 11 |
| Sidebar | ✓ | ✓ | ✓ | ✗ nav rest (muted) | ✗ 9, 10 |
| ActionMenu / Item | ✓ | ✗ 1 | ✓ | ✗ rest (muted) | |
| Tooltip | ✓ | ✓ | ✓ | ✓ | ✗ 5 |
| Popover | ✓ | ✓ | ✗ 3 | ✓ | ✗ 10 |
| Sheet / Overlay | ✓ Escape | ✓ | ✗ 2 | ✓ | ✗ 9, 10 |
| ResizeHandle | ✗ 4 | ✗ 4 | — | — | |
| Table / SimpleTable | ✓ sort | ✓ `aria-sort` | — | ✗ muted body text | ✗ 7 |
| CodeSurface / CodeBlock / JsonCodeView / ApiResponseViewer | ✗ 6 | ✓ region | — | ✗ 8.1 syntax, pills | |

The a11y fixes are almost all **behaviours** (focus trap, focus return, window splitter, hoverable tooltip, roving menu items), so they ride along with the state-behaviours refactor rather than being a separate pass.

---

## Plan (agreed order)

Direction (2026-10-21): this is a **refactor onto proper behaviours** per `packages/react/docs/behaviours.md`, not only an API rename. Generic behaviours are low-level hooks; each component calls exactly one component behavior that returns props objects to spread on its elements; refs go through a `useProvidedRefOrCreate`.

1. **Foundation: generic behaviours** in `src/behaviors/`, each with its own tests (**done 2026-10-21**, 89 tests; documented in `packages/react/docs/behaviours.md`): `useControllableState`, `useProvidedRefOrCreate`, `useDismiss` (Escape + click-away), `useAnchoredPosition`, `useResizable` (pointer **and** keyboard), `useFocusTrap`, `useFocusReturn`, `useRovingFocus` (menu keys, Home/End, typeahead).
2. **Component behaviours + migration, one component at a time**, each with its a11y fixes and renames: Overlay/Sheet (`open`/`onOpenChange`, trap, return, reduced motion), Popover (`usePopover`), Tooltip (`useTooltip`, hoverable), ActionMenu (`useActionMenu`, `menuitemradio`, `leadingVisual`/`trailingVisual`), Sidebar + ResizeHandle (`useResizable`, separator role), SimpleTable (`sorting`/`defaultSorting`), CodeSurface (watchlist, scroller `tabIndex`).
3. **Vocabulary pass** (§1, §4, §5) as one breaking release with a migration note per rename, including `Pill.border` → a boolean name (`bordered`), Breadcrumbs compound parts, `Length`/`SpaceValue` on the dimension props.
4. **Root contract** (§3) for the nine components that skip it.
5. **`components.json` + dictionary check + `scripts/a11y-sweep.mjs` in CI** (§7, §8), then the 56 missing JSDoc comments.
6. **CSS props on primitives** (§6), still to be decided.
7. **Token contrast fixes** (§8.1) are a design review; they run in parallel and do not block the code work.

## Decisions

**Made (2026-10-21):**
- The whole audit is accepted as valid. `x` / `defaultX` / `onXChange` is the contract everywhere, including Sheet's `onDismiss` → `onOpenChange`. Accessibility is checked per component (§8). The refactor follows `behaviours.md`.
- **Naming rule: dot notation for parts, wherever it applies.** `ActionMenu.List`, `ActionMenu.Item`, `Breadcrumbs.Item`, `SiteHeader.Divider`, `Popover.Header`/`Popover.Footer`, like `Sidebar.Item`, `Sheet.Header` and `Table.Row` already are. The flat exports (`ActionMenuItem`, `ActionMenuList`, `BreadcrumbLink`, `SiteHeaderDivider`) are removed, not aliased.
- **Complex components build their layout from `Box`, not bare `div`s** (ActionMenu, Popover, Sheet, Sidebar, Table parts, Tooltip panel…), so they inherit the CSS-prop API and the token props.
- **Boolean props read as booleans:** `Pill.border` is renamed (`bordered`).
- **Breadcrumbs gets compound parts** (`Breadcrumbs.Item`), `items` stays as the shorthand. **ActionMenu items use `leadingVisual` / `trailingVisual`** (and `description` for `subtext`).
- **`Button.alignContent`:** it does something other than CSS `align-content` (it places the content along the row), so it is renamed to what CSS calls that: `justifyContent`, taking CSS values.
- **`Container.width` → `maxWidth`** (the named stops `page | content | full`, or any Length), since that is what it sets.
- **Divider `color` and Highlight `color` stay.** Divider's colour is its (background) fill and Highlight's is its tint; both read naturally as "the colour of this thing".
- **Non-Box primitives accept CSS props** (option b: one shared prop-splitting utility extracted from Box, used by Text, Heading, Subtitle, Link, Icon, Divider, Pill, Highlight…).
- **Popover is a popover:** a non-modal anchored overlay that can hold anything (text, a menu, a form). It does not imply `role="dialog"`; the consumer or the content says what it is. Focus stays where the user put it unless the content asks for it.
- **Callout is a Box** with a preset padding, border and colour, forwarding every Box prop. It gets 4 to 5 variants **named after the colour, not the meaning**, using the same palette as Highlight (neutral, green, blue, yellow, orange, red, lime, purple). The prop name is open (it cannot be `color`, which is Box's text colour).
- **Tooltip's anatomy is parked** until the tooltip patterns have been studied further; the behavioural fixes that do not depend on it (hoverable, dismissible) still go in the shared behaviours.

**Still open:**
1. §1: the new names for Link `variant` (inline/standalone/inherit) and the logical `edge` values (`start | end | top | bottom`), and the Callout variant prop name (`tint`? `tone`?).
2. §8.1: who owns the palette changes, and whether `muted` should be re-spaced from `default` (a design call).
3. Tooltip anatomy (after the study).
