import type { Node, PropDoc, Value } from "../../../../engine/types";
import { setValue, shownValue } from "../../overrides";
import type { Live, PropInfo } from "./types";

/**
 * What one prop's selector knows of the example being played with: whether it can be changed (the engine knows the prop, it is not state the
 * app holds, there is an example), what the example says of it now, and how to change it. Without a Playground (`live` null: a part's props,
 * or no frame selected) nothing can be changed and the prop is read as its type.
 */
export function useProp(prop: PropInfo, live: Live | null) {
  const doc: PropDoc | undefined = live?.base?.doc.props.find((p) => p.name === prop.name);
  const node: Node | null = live?.base?.node ?? null;
  const overrides = live?.overrides ?? {};
  // What the engine calls state (`value`, `defaultValue`) the app holds: changing it here would make the component controlled with no one to answer.
  // A prop the engine does not list (Box's `padding`, `gap`: written as a mapped type, which the model cannot read) is a prop all the same.
  const editable = !!live && !!node && doc?.kind !== "state";
  return {
    /** The component the example is of: what a slot's candidates are tried in. */
    component: live?.base?.component ?? "",
    doc,
    node,
    editable,
    /** Whether the pane can set it at all, state or not: what is typed (text, a number) is the pane's to set; what is chosen from the app's own state is not. */
    settable: !!live && !!node,
    /** What the example sets, with the changes made here (a node, text, a list), or nothing. */
    current: setValue(prop.name, node, overrides),
    /** What is shown for it: the example's value, the changes, or the default. */
    shown: shownValue(prop.name, node, overrides, prop.default),
    /** What the example writes as elements for this prop (`children`, `trigger`…) as the code has it, while it has not been changed here: shown as that code. */
    written: prop.name in overrides ? undefined : live?.base?.written?.[prop.name],
    set: (value: Value | undefined) => live?.change(prop.name, value),
  };
}

export type PropState = ReturnType<typeof useProp>;
