/**
 * The interaction registry: every event the States view knows about, in one place. This is data, not behaviour. The rest of the
 * view (derive.ts, the badges, later the popover's text) reads it, so adding an interaction means adding an entry here.
 *
 * The causal rule (see docs/backlog/docs-shell-experiment.md): an **interaction** is something a person does; a **state** is what
 * the component becomes because of it. Things nobody does (time passing, data arriving) can also change a component, so they are
 * kept in the same registry under `cause: "system"` and never drawn as a user badge.
 *
 * Many physical inputs mean one logical interaction: click, tap, Enter, Space and a screen reader's "activate" are all `activate`,
 * because a component cannot tell them apart. `inputs` lists the physical forms, for the popover.
 */

export type Channel = "pointer" | "keyboard" | "text" | "focus" | "assistive" | "time" | "data" | "environment";

/** How a stylesheet, the DOM or the API shows that this interaction exists. Each is a way to derive it, never a list per component. */
export type Signals = {
  /** A CSS pseudo-class the rules react to (and, for those the shell can force, `forceable`). */
  pseudo?: string[];
  /** An ARIA or data attribute that records the resulting state. */
  attributes?: string[];
  /** The typed change event that reports it (the `onXChange` of a controlled `x`, in components.json). */
  events?: string[];
  /** The ARIA roles whose Authoring Practices keyboard pattern includes it. */
  roles?: string[];
};

export type InteractionDef = {
  label: string;
  /** One plain sentence: what the person does. */
  summary: string;
  cause: "user" | "system";
  channels: Channel[];
  /** The physical forms it takes. */
  inputs: string[];
  signals: Signals;
  /** The dev-only rewrite (forceStates.ts) can show the resulting state without a pointer. Only these can be drawn today. */
  forceable?: boolean;
};

const define = <T extends Record<string, InteractionDef>>(registry: T) => registry;

export const INTERACTIONS = define({
  // — People —
  hover: {
    label: "hover",
    summary: "Moves the pointer over it.",
    cause: "user",
    channels: ["pointer"],
    inputs: ["pointer enters", "pointer leaves"],
    signals: { pseudo: [":hover"] },
    forceable: true,
  },
  focus: {
    label: "focus",
    summary: "Moves keyboard focus to it.",
    cause: "user",
    channels: ["keyboard", "focus"],
    inputs: ["Tab", "Shift+Tab", "click on a field"],
    signals: { pseudo: [":focus-visible", ":focus-within", ":focus"] },
    forceable: true,
  },
  press: {
    label: "press",
    summary: "Holds it down, before letting go.",
    cause: "user",
    channels: ["pointer", "keyboard"],
    inputs: ["pointer down", "Space or Enter held"],
    signals: { pseudo: [":active"] },
    forceable: true,
  },
  activate: {
    label: "activate",
    summary: "Uses it: the one thing it is for.",
    cause: "user",
    channels: ["pointer", "keyboard", "assistive"],
    inputs: ["click", "tap", "Enter", "Space", "screen reader or voice activation"],
    signals: { events: ["onClick", "onPress"], roles: ["button", "link", "menuitem", "tab", "option"] },
  },
  edit: {
    label: "edit",
    summary: "Types, pastes or clears text.",
    cause: "user",
    channels: ["keyboard", "text"],
    inputs: ["type", "paste", "cut", "clear", "autofill", "IME composition"],
    signals: { pseudo: [":placeholder-shown", "::placeholder"], attributes: ["data-placeholder"], events: ["onChange", "onValueChange"], roles: ["textbox", "searchbox", "combobox"] },
  },
  choose: {
    label: "choose",
    summary: "Picks one (or several) from a set.",
    cause: "user",
    channels: ["pointer", "keyboard"],
    inputs: ["click an option", "Enter or Space on an option", "typeahead then Enter"],
    signals: { pseudo: [":checked"], attributes: ["aria-selected", "aria-checked", "data-selected"], events: ["onValueChange", "onSelect", "onCheckedChange"], roles: ["option", "radio", "checkbox", "menuitemradio", "menuitemcheckbox"] },
  },
  navigate: {
    label: "navigate",
    summary: "Moves through the parts of one widget without leaving it.",
    cause: "user",
    channels: ["keyboard"],
    inputs: ["arrow keys", "Home", "End", "PageUp", "PageDown", "type to jump"],
    signals: { attributes: ["aria-activedescendant", "data-active"], roles: ["listbox", "menu", "menubar", "tablist", "tree", "grid", "radiogroup", "combobox"] },
  },
  toggle: {
    label: "toggle",
    summary: "Opens or closes something, or switches it on or off.",
    cause: "user",
    channels: ["pointer", "keyboard"],
    inputs: ["click the trigger", "Enter or Space", "Arrow Down on a combobox"],
    signals: { attributes: ["aria-expanded", "aria-pressed", "data-open"], events: ["onOpenChange", "onExpandedChange", "onPressedChange"], roles: ["combobox", "dialog", "menu", "switch", "button"] },
  },
  dismiss: {
    label: "dismiss",
    summary: "Closes or cancels it.",
    cause: "user",
    channels: ["keyboard", "pointer"],
    inputs: ["Escape", "press outside", "a close button"],
    signals: { events: ["onOpenChange", "onDismiss", "onClose"], roles: ["dialog", "menu", "listbox", "combobox"] },
  },
  drag: {
    label: "drag",
    summary: "Presses and moves: resizes, reorders, slides.",
    cause: "user",
    channels: ["pointer", "keyboard"],
    inputs: ["pointer down and move", "arrow keys on a handle"],
    signals: { attributes: ["aria-valuenow", "data-dragging"], events: ["onResize", "onValueChange"], roles: ["slider", "separator", "scrollbar"] },
  },
  scroll: {
    label: "scroll",
    summary: "Moves what is in view.",
    cause: "user",
    channels: ["pointer", "keyboard"],
    inputs: ["wheel", "touch swipe", "PageUp or PageDown", "Space"],
    signals: { events: ["onScroll"] },
  },

  // — Nobody does these, but they change a component too —
  load: {
    label: "load",
    summary: "Data it was waiting for arrives.",
    cause: "system",
    channels: ["data"],
    inputs: ["a request finishes"],
    signals: { attributes: ["aria-busy", "data-loading"] },
  },
  validate: {
    label: "validate",
    summary: "A rule is checked and passes or fails.",
    cause: "system",
    channels: ["data"],
    inputs: ["on change", "on blur", "on submit"],
    signals: { pseudo: [":invalid", ":user-invalid"], attributes: ["aria-invalid", "data-invalid"] },
  },
  elapse: {
    label: "elapse",
    summary: "Time passes: a timeout, a debounce, an animation ends.",
    cause: "system",
    channels: ["time"],
    inputs: ["timer", "transitionend", "animationend"],
    signals: {},
  },
  adapt: {
    label: "adapt",
    summary: "The environment changes: width, colour scheme, motion preference.",
    cause: "system",
    channels: ["environment"],
    inputs: ["viewport resize", "prefers-color-scheme", "prefers-reduced-motion", "forced-colors"],
    signals: {},
  },
});

export type InteractionId = keyof typeof INTERACTIONS;

/** The ones the shell can draw today: each has a pseudo-class the dev rewrite can force by `data-force`. */
export type ForceableId = { [K in InteractionId]: (typeof INTERACTIONS)[K] extends { forceable: true } ? K : never }[InteractionId];

export const ids = Object.keys(INTERACTIONS) as InteractionId[];
export const forceableIds = ids.filter((id): id is ForceableId => (INTERACTIONS[id] as InteractionDef).forceable === true);
export const userInteractionIds = ids.filter((id) => INTERACTIONS[id].cause === "user");
