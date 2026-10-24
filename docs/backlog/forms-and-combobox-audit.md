# Audit: form controls and combobox family

Audit of the components built 2026-10-23/24: `InputField` (chrome), `InputText`, `TextArea`, `Select`, `Autocomplete`, `ActionMenu.Search`, `ActionMenu.Empty`, `EmptyState`, `TileIcon`, and what they changed in `Popover`, `ActionMenu` and `useActiveDescendant`. Done 2026-10-24 against ADR-01 to 04 (including ADR-04's 2026-10-22 amendment), `packages/react/docs/{style,behaviours,testing,token-consumption,versioning}.md`, `docs/backlog/api-audit.md`, and the Figma frames. Findings were resolved the same day; this file is the record.

**Method.** Standards read in full. Code reviewed by hand. Real-Chrome sweep: Storybook stories driven over the Chrome DevTools protocol, axe-core with colour contrast **on** (the jsdom tests run it off), light and dark, popups opened with real mouse clicks, screenshots read. Figma variable values read with `get_variable_defs` and compared to the repo tokens. The sweep is now `npm run a11y:sweep` (`packages/react/scripts/a11y-sweep.mjs`).

**Status key:** Fixed · Decided (recorded in an ADR) · Open.

## Verified fine

- CSS reads only `--cube-*` variables that exist in `theme.css`, checked per stylesheet in both modes (ADR-04 amendment). No token variable is inlined on any element.
- Colour tokens are hex or references (ADR-02); the new token file is valid DTCG (ADR-01).
- `data-component` names on every part, states by `data-*` attributes, `mergeProps` and `clsx`, `useControllableState`, React 19 `ref` props, no `forwardRef`.
- `npm run check:icons` passes. Popups anchor to the field's box and match its width in both modes.
- `Component.docs.json` is optional per the migration tracker, so its absence is not a finding.

## Findings and what happened

### High

| # | Finding | Evidence | Status |
|---|---|---|---|
| H1 | **Contrast failures.** Help text and placeholder used `neutral.subtle` (2.34:1 light, 2.33:1 dark); dark error text 3.91:1; read-only text 4.3:1 on the inset surface; item descriptions 4.3:1 on the hover row. | Real-Chrome axe: 20 of 70 runs failed, all `color-contrast`. Cause: Figma was mapped to tokens by name, but Figma's `fg/neutral/subtle` (`#888783`) is the repo's *old* `neutral.muted`. Figma's `canvas/inset` is `#f9f9f8`; the repo's `canvas.inset` is `#f4f4f2` (same as disabled). | **Fixed.** `neutral.subtle` repointed to `gray.7` (4.74:1 on white; `gray.6` is shared with the Pill palette, so not edited); help text and placeholder use `neutral.muted`; read-only is `neutral.light.2` + `neutral.default` (Figma-exact); disabled uses `neutral.disabled`; item descriptions use `neutral.default`; dark `fgColor.{danger,critical,error}.strong` override to `red.10` (5.0:1). Non-text uses of `subtle` (site-header divider, bracket highlighter) keep their look via `display.gray.6`. Guarded by `fieldContrast.test.ts`. Re-run: 70 of 70, then 112 of 112 clean. |
| H2 | **Empty popup opens** when children render nothing: `Children.count` counts `null` and `false`. | Probe test: `{false}{null}` opened an empty listbox. | **Fixed** (`Children.toArray`), regression test added. |
| H3 | **Behaviours architecture.** `Select`, `Autocomplete`, `ActionMenu.Search` assembled generic hooks inline and repeated the same combobox logic; the shared list lived in `ActionMenu`'s internals under a misleading context name. | `behaviours.md`: one component behavior per component, returning props objects. | **Fixed.** `ActionList` extracted (ADR-06); `useCombobox` is the component behavior for `Select` and `Autocomplete`; context renamed `ActiveOptionContext`. `ActionMenu.Search` still uses `useActiveDescendant` directly, deliberately (ADR-06). |
| H4 | **Size vocabulary.** Input `md` was 28px while Button `md` was 32px. | API audit: `size` means the same everywhere. | **Fixed and Decided.** Library-wide `sm` 24, `md` 28, `lg` 32; `xs` and 40px removed from `size.control`, `button.paddingInline`, `button.font`, `iconButton`; callers shifted pixel-for-pixel (ADR-05). |

### Medium

| # | Finding | Status |
|---|---|---|
| M1 | **Form-control root contract.** `className`, `style`, `ref` and rest props go to the native control; `testing.md` wants `behavesAsComponent`, which cannot apply. | **Decided** (control), ADR-05. **Fixed:** `behavesAsFormControl` added and applied to `InputText`, `TextArea`, `Select`, `Autocomplete`; `Select`'s `className` moved from the wrapper to its box; `wrapperProps` added so `Autocomplete` names its own root. |
| M2 | **Copy-pasted logic:** id, `invalid`, `describedby` in three components; `present()` twice. | **Fixed.** `useFieldControl`, `isPresent`. |
| M3 | **Decisions not followed:** flat part names; bare elements instead of `Box`. | **Fixed:** `InputField.Shell`. **Decided:** form-control chrome is plain elements + CSS modules (Primer's form controls use no `Box`), ADR-05. |
| M4 | **State contract:** `Select` had no `open`/`defaultOpen`/`onOpenChange`; `Autocomplete` no `defaultOpen`. Callback shape: `style.md` says object argument, API audit says `onXChange(value)`. | **Fixed** (both now take the trio, via `useCombobox`). **Decided:** keep the plain value, ADR-05. |
| M5 | **ADR-04 said "piloted on Button and IconButton"**; the shape is now used widely. `token-consumption.md` described the old recipe. | **Fixed.** ADR-04 amendment 2 (2026-10-24); `token-consumption.md` rewritten; `behaviours.md` and `testing.md` extended. |
| M6 | **Verification:** jsdom axe runs with contrast off; no real-browser check. | **Fixed:** `npm run a11y:sweep`. **Open:** run it in CI (needs a built or running Storybook and Chrome). Playwright VRT/AVT (`testing.md`) still not set up. |
| M7 | **Figma sync (ADR-03):** `input` tokens had no `org.cuboid.figma` metadata; Figma's error border is two-tone. | **Fixed:** metadata on all 22 leaves. **Open:** two-tone error border (outer `#e34848`, inner `#d50606` in Figma; the repo has `borderColor.danger` and a pale `borderColor.error`); needs a design call on which palette steps. |
| M8 | **Accessibility and polish.** | **Fixed:** focus ring overlapped the popup top (the popup's gap now clears it when anchored to a field). **Open:** live announcement of result count and "no results"; `Select` typeahead; an active row and a chosen row look identical in the search menu. |

### Low

| Finding | Status |
|---|---|
| `Select` `onOpenChange` ternary | Fixed (gone in the rewrite). |
| `CHANGELOG.md` entry, tracker rows, `core-components.md` row 37 | Fixed. |
| Removing the DOM `onSelect` from `ActionMenuProps` narrows a type (`versioning.md`: major) | Recorded in the changelog. |
| `useActiveDescendant` queries the DOM on every render | Open (fine for short lists; revisit for long ones). |
| `Select` finds the closed label only through direct `Select.Option` children (and treats `""` as nothing chosen) | Open (document, or find the label from the rendered option). |
| `TileIcon` sets its fill inline (`style.md` prefers a custom property) | Open. |

## Decisions made while resolving this audit

1. **Sizes** follow Button's names and are 24 / 28 / 32 everywhere: `sm`, `md`, `lg`. No `xs`, no 40px. Defaults: Button `md`, IconButton `sm`, form controls `md`.
2. **Form controls:** `className`, `style`, `ref` and native props go to the control; `wrapperClassName` and `wrapperProps` go to the wrapper.
3. **Callbacks:** keep `onXChange(value)`. Primer's newer components use an object argument (`onChange({value})`) so the signature can grow, and older ones pass the value; Cuboid already ships the plain form and is pre-1.0, so consistency wins. A callback that needs more takes a second argument.
4. **Chrome:** form-control chrome is plain elements with CSS modules; layout components stay on `Box`.
5. **Contrast:** repoint a semantic token to a base step that passes, never edit a shared base step; a dark-only problem gets a dark override. Help text and placeholder use `neutral.muted`.

## Baselines measured

- **New components, Button, IconButton, ActionMenu** (50 stories, 112 runs, light and dark, popups open): 112 clean.
- **Whole library** (209 stories, 430 runs): 325 clean, **105 with findings**, none in the components above. They are the palette and story issues already listed in `api-audit.md` §8: code-block syntax colours, Pill palettes, ApiResponseViewer, and Box, Callout, Container, Heading, Link, Subtitle, Text and Overlay stories (`color-contrast`); code-block scroll regions (`scrollable-region-focusable`); Breadcrumbs, Divider, Heading and Sidebar stories (`landmark-unique`, `list`, `heading-order`). Run `npm run a11y:sweep` for the list.
- **Already failing before this work:** two `packages/primitives` tests in `src/darkMode.test.ts` (dark text colours weaker than light's for the success/danger/critical/error steps; button danger text on its fill). Confirmed by stashing the one token file this work edited and running them on the committed version.

## Not built yet (deferred by decision)

Typeahead in `Select`; loading and "create new" rows; live announcement of result count; character count; label tooltip; help and error icons; `TextArea` auto-grow; native `<select>` fallback for small screens; closing `Autocomplete`'s list on blur (it closes on Escape, Tab, choosing and a press outside; blur is deliberately not a trigger so clicks on options work). Tracked in `CHANGELOG.md` (2026-10-24) and `ADR-05`/`ADR-06` "not deciding".
