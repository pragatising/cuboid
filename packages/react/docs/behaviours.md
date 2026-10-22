Implementing Behaviors


## Generic behaviors
Generic behaviors provide functionality that is not specific to any single component or class of components. If you can't tell which component it should operate on, it's probably a generic behavior. Generic behaviors are low-level. Generic behaviors may only have dependencies on other generic behaviors.

Examples
useProvidedRefOrCreate
usePosition
useClickAway
useTypeAhead

## Component behaviors
Component behaviors specifically implement behaviors for components. Therefore, hooks that implement component behaviors should always return an object containing props objects to be spread across the elements that make up the component's JSX. While component behaviors do not necessarily have to be one-to-one, a component may only use one component behavior. Sometimes it makes sense to use the same component behavior on several components. For example: the Dialog, and Popover components may all use the usePopover component behavior.

Component behavior examples
usePopover
useComboBox
useFilteredSearch
useDetails

## Implementation guidelines
All behaviors should be implemented as React Hooks.
Component behaviors should be relatively brief. A component behavior should build a component's experience through the combination of several configured generic behaviors.

Example: The Dialog component uses a usePopover behavior. The usePopover behavior in turn may call generic behaviors such as usePosition (to position the popover on the screen), useClickAway (to set up an event handler for clicking outside of the dialog), and useFocusTrap (to prevent focus from leaving the dialog while it is being shown).

## Component implementation
Component implementation is discussed elsewhere, but with respect to behaviors, follow these guidelines.

If a component has behaviors, it should make a call to exactly one component behavior hook.
The hook will return an object containing multiple props objects. Each of the returned objects are props that should be spread onto the appropriate JSX element.
Component implementations should be as clean as possible, mostly consisting of the JSX tree definition that the component renders.
Component props and, in some circumstances, context values, should serve as arguments to component behavior hooks.

Return value of behavior hooks
Component behavior hook return value
Component behavior hooks produce props. Therefore, the return value of a component behavior should be a collection of props objects, intended to be spread onto JSX elements that render a component.

Each element of the object returned from a component behavior hook is a props object that can be spread onto a JSX element
The names of the keys should accurately indicate the JSX element onto which those props should be spread
Example: The Dialog component uses a usePopover component behavior, which may return an object like:

{
  popoverProps: PropsObject,
  openClickTargetProps: PropsObject,
  closeClickTargetProps: PropsObject
}
Each of these props objects would then get spread onto their respective JSX elements.

Generic behavior hook return value
There are no restrictions on return values of generic behavior hooks. In fact, some behavioral hooks might not need to return anything. For example, a useEscape hook might simply set up a callback for an Escape keypress.

## Refs
Often, a behavior will need to act on a real DOM element.
In this case, the hook should return a ref as part of the returned props for that element. The ref will get spread onto the element, giving the ref access to it.
Whenever you need a ref, it must be accepted as an optional setting to the hook. The hook then uses the useProvidedRefOrCreate hook to resolve a usable ref. Remember to return the resulting ref from the hook.
Testing behaviors
Whenever possible, test your changes in another application that makes heavy use of Primer Components.
You may even want to build and “marinate” your component in another application before merging a change to Primer Components.
Build the component, start using it in the application, and see how the component API feels. This approach works best for engineers at GitHub already working on a product written in React.

B: Contents passed as data
<List
  items={[
    {text: 'New file'},
    ActionList.Divider,
    {text: 'Copy link'},
    {text: 'Edit file'},
    {text: 'Delete file', variant: 'danger'},
  ]}
/>

## Cuboid's behaviors (`src/behaviors/`)

Built 2026-10-21 as step 1 of the API refactor (see `docs/backlog/api-audit.md`). Every one is a generic behavior: it knows nothing about any one component and depends only on the others. Component behaviors (`usePopover`, `useActionMenu`, …) are built from them, live next to their component, and return props objects to spread. Nothing here is exported from the package root yet.

| Hook | What it does | Replaces |
|---|---|---|
| `useControllableState({ value, defaultValue, onChange })` | the `x` / `defaultX` / `onXChange` contract; stable setter; `onChange` only on a real change; warns when a component flips between controlled and uncontrolled | four hand-rolled copies (Popover, ActionMenu, Sidebar, SimpleTable, CodeSurface) |
| `useProvidedRefOrCreate(ref)` | a ref object to put on an element that also feeds the consumer's object or callback `ref` | `mergeRefs` in Popover and ActionMenu, `panelRef` |
| `useEscape(handler, enabled)` | Escape, answered only by the most recently enabled listener, so Escape peels one layer at a time; ignores `defaultPrevented` and IME composition | Escape handlers in Overlay, Sheet, Popover, Tooltip |
| `useClickAway(refs, handler, enabled)` | a press outside every ref (capture phase) | Popover's outside-click |
| `useDismiss({ enabled, onDismiss, refs })` | `useEscape` + `useClickAway` | |
| `useAnchoredPosition({ anchorRef, placement, gap, enabled })` | `position: fixed` coordinates for 8 placements, re-measured on scroll and resize, no re-render when nothing moved | `computeFixedPosition` in Tooltip and Popover |
| `useResizable({ value, min, max, onChange, … })` | pointer drag **and keyboard** (Arrows, Shift, Home, End) with the window-splitter ARIA (`role="separator"`, `aria-orientation`, `aria-valuenow/min/max`) | the resize math in Sheet and Sidebar; ResizeHandle gets a keyboard |
| `useFocusReturn({ enabled })` | remember the opener before the layer takes focus (an insertion effect, so before `autoFocus`), give focus back on close, but not if the user moved it elsewhere | `returnFocusOnClose` in Popover |
| `useFocusTrap({ enabled, containerRef })` | move focus in, wrap Tab and Shift+Tab, pull focus back if it escapes, return it on close: what `aria-modal` promises | nothing yet: Sheet had no trap |
| `useRovingFocus({ containerRef })` | arrow / Home / End navigation, disabled items skipped, typeahead; `focusFirst` / `focusSelected` | `actionMenuKeyboard.ts` (which had no typeahead) |

Conventions: a hook that needs an element takes a ref (or, for a behavior that returns props, accepts an optional ref via `useProvidedRefOrCreate`); handlers that must stay current are read through a ref so effects do not re-subscribe; anything that touches `document` is guarded by `enabled` so it costs nothing while a layer is closed.

