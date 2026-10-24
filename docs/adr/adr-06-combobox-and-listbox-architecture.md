# ADR-06: One list, two focus models, one combobox behavior

**Status:** Approved, Adopted
**Decided:** 2026-10-24

## Decision

1. **One shared list: `ActionList`** (`components/core/ActionList/`). It is the rows for `ActionMenu`, `Select` and `Autocomplete`:
   `ActionList` (with `.Section`) and `ActionListItem`. It takes a `role`: `menu` (items are `menuitem`, `menuitemradio` or
   `menuitemcheckbox`, chosen state is `aria-checked`) or `listbox` (items are `option`, chosen state is `aria-selected` on every
   option). `ActionMenu.List`, `.Item`, `.Section` are these. Internal: not exported from the package root. Stable `data-component`
   names are kept where they exist (`ActionMenu.*`) and are set by each consumer where they do not (`Select.Option`,
   `Autocomplete.Item`).
2. **Two focus models.** A `menu` uses **roving focus** (`useRovingFocus`): real focus moves onto the items. A combobox uses
   **active descendant** (`useActiveDescendant`): the control keeps focus and names the active option with `aria-activedescendant`;
   the first option (or, for a select, the chosen one) is active whenever the list changes. **A menu that has a search field becomes a
   `listbox`**, because a text input is not valid inside `role="menu"`.
3. **One component behavior: `useCombobox`** (`kind: "input" | "select"`). It owns the open state, the active option, the keys,
   choosing, and the popup wiring, and returns props objects named for their element (`controlProps`, `popoverProps`, `listProps`,
   plus `activeOption` for the rows' context), as `behaviours.md` requires. `Select` and `Autocomplete` are mostly markup on top of
   it. `ActionMenu.Search` uses `useActiveDescendant` directly, because the `ActionMenu` root owns its popover; fold it in when
   `ActionMenu` gets its own component behavior.
4. **`Popover` can anchor to something other than its trigger** (`anchorRef`, with the trigger rendered as is: no toggle, no ARIA) and
   match the anchor's width (`matchAnchorWidth`). Anchored to a field, it clears the field's focus ring.
5. **Filtering belongs to the consumer.** The menu, select and autocomplete render the children they are given. With nothing to show
   they show an `EmptyState` if one is provided; the empty list stays in the DOM, hidden, so `aria-controls` still resolves.

## What this is not deciding

Typeahead in `Select`, loading and "create new" rows, live announcements of the result count, a native select fallback, and renaming the
`actionMenu` tokens to a neutral group (the shared list still reads `--cube-actionMenu-*`).
