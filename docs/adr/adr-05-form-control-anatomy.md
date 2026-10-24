# ADR-05: Form-control anatomy, root contract and conventions

**Status:** Approved, Adopted
**Decided:** 2026-10-24

Covers `InputText`, `TextArea`, `Select`, `Autocomplete` and the chrome they share (`InputField`). Decided while auditing them
(`docs/backlog/forms-and-combobox-audit.md`).

## Decision

1. **Anatomy.** `InputField` is the chrome: a label, the control, help text and a validation message. `InputField.Shell` is the bordered
   box around the control with an optional leading and trailing visual, and a `multiline` mode for textareas. The control is the native
   element inside it (`<input>`, `<textarea>`, or the select's focusable `<button role="combobox">`). `useFieldControl` supplies the id,
   the invalid state and `aria-describedby` (help text, then error, then the consumer's own) so no control copies that logic.
2. **Root contract for form controls.** A form control behaves like its native element: `className`, `style`, `ref`, `id`, `name`,
   `value`, `data-*`, `aria-*` and every other native prop go to the **control**, the element that holds focus. Only `wrapperClassName`
   and `wrapperProps` reach the outer wrapper. The wrapper carries `data-component` (`InputText`, `TextArea`, `Select`, `Autocomplete`).
   This replaces "rest props go to the root" (`style.md`) for form controls only, because a consumer reads `ref` to focus a field and
   spreads `name`, `value` and `aria-*` expecting them to land on it. `behavesAsFormControl` (`src/test/testing.tsx`) asserts it, in place
   of `behavesAsComponent`, which cannot apply.
3. **Size vocabulary: `sm`, `md`, `lg` = 24, 28, 32px, library-wide.** One `size.control` scale serves Button, IconButton and the form
   controls, so `size="md"` is the same height everywhere. There is no `xs` and no 40px size (too large). Defaults: Button `md`,
   IconButton `sm`, form controls `md`.
4. **Callbacks pass the plain value: `onXChange(value)`.** Primer's `style.md` prefers an object argument (`onChange({ value })`) so the
   signature can grow, and Primer's newer components (`Tabs`, `TreeView`, `UnderlinePanels`) follow it while older ones
   (`onSelectedChange(selected)`) do not. Cuboid already ships `onOpenChange(open)`, `onValueChange(value)` and friends and is
   pre-1.0, so consistency wins. When a callback needs more context it takes it as a *second* positional argument (an event or the
   chosen element); existing arguments never move. Revisit if a callback outgrows that.
5. **Form-control chrome is plain elements with CSS modules, not `Box`.** Primer's `TextInput`, `FormControl` and `Select` use no
   `Box`. Layout components (`Sidebar`, `Popover` header, `Callout`) stay built on `Box`, as decided in the API audit.
6. **Colours** come from the `input` tokens, read in CSS: help text and placeholder use `neutral.muted`, read-only text uses
   `neutral.default` on `bgColor.neutral.light.2`, disabled uses `neutral.disabled` (exempt from WCAG contrast, like Button), error
   text and border use the danger colours (dark mode gets a lighter step). Every text pair is checked in
   `fieldContrast.test.ts` in both modes.
7. **Open state.** Anything that opens takes `open` / `defaultOpen` / `onOpenChange(open)` (`Select`, `Autocomplete`, `ActionMenu`).

## What this is not deciding

- Character count, label tooltip, help and error icons, auto-grow for `TextArea`: not built (tracked in the audit).
- A native `<select>` fallback for small screens: a product decision, deferred.
- Whether a form-control wrapper should also accept CSS props through the shared prop splitter (API audit §6, still open).
