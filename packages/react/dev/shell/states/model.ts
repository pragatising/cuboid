/**
 * The meta model of the States view. Two kinds of thing, kept apart, and a causal link between them:
 *
 *  - an **interaction** is what a person does: an arrow with a badge, drawn from the place where it happens (a button, a list item);
 *  - a **state** is what the component becomes because of it: the rendered component, with that place put in the state.
 *
 * A component is a set of **parts** (`ActionMenu.Item`, the field's shell…), and each part has its own states and interactions.
 * None of it is listed per component: it is found in the component's own stylesheet and DOM (see derive.ts).
 */
import type { ForceableId, InteractionId } from "./interactions";

export type { ForceableId, InteractionId };

/**
 * How to put one element in a state. The physics is what the browser does: a pseudo-state is forced (`data-force`, dev/forceStates.ts),
 * an attribute that records a state is set or removed, a field is given text. `target` is the element's index in the preview's DOM.
 */
export type Action = { kind: "force"; token: ForceableId } | { kind: "set"; name: string; value: string } | { kind: "unset"; name: string } | { kind: "text"; text: string };
export type Step = { target: number; action: Action };

export type State = { id: string; label: string; apply: Step[] };

/** An arrow from one state to another, with the badge that names it. `target` is where it happens. */
export type Interaction = { id: InteractionId; label: string; from: string; to: string; target: number };

/** What a part's stylesheet says: the states it styles and the interactions that lead between them. */
export type StateModel = {
  /** Reached by interaction, in the order they are reached. The first is `rest`. */
  states: State[];
  interactions: Interaction[];
};

export type PartModel = { part: string; model: StateModel };
