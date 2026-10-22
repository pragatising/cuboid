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
