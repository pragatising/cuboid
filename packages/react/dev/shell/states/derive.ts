import { INTERACTIONS, forceableIds, ids } from "./interactions";
import type { ForceableId, InteractionDef, InteractionId } from "./interactions";
import type { Action, PartModel, State, StateModel, Step } from "./model";

const def = (id: InteractionId) => INTERACTIONS[id] as InteractionDef;

/** The pseudo-class an interaction maps to, for the popover to show. */
export const pseudoOf = (id: InteractionId) => def(id).signals.pseudo?.[0];

/** An attribute that records a state names it: `aria-expanded` is "expanded", `data-open` is "open". */
const stateName = (attribute: string) => attribute.replace(/^(aria|data)-/, "");

/** Which interaction records its result in this attribute (from the registry's signals), if any. */
const interactionOfAttribute = (attribute: string): InteractionId | undefined => ids.find((id) => def(id).cause === "user" && def(id).signals.attributes?.includes(attribute) && id !== "edit");

/** A rule that styles the empty text field. The field is "filled" when the browser stops matching it. */
const EMPTY = /::placeholder|:placeholder-shown/;

/** What a single rule's selector reacts to. */
type Signal = { interaction: InteractionId; id: string; label: string; probe: (element: Element) => Step["action"] | null };

/**
 * Reads one selector for the signals it contains. After the dev rewrite `:hover` is `:is(:hover, [data-force~="hover"])`, so a
 * forced attribute is how a pointer or focus interaction shows up. An attribute rule (`[aria-expanded="true"]`) shows a state
 * that something recorded. A placeholder rule shows the empty field.
 */
export function selectorSignals(selector: string): Signal[] {
  const found: Signal[] = [];
  for (const match of selector.matchAll(new RegExp(`\\[data-force~="(${forceableIds.join("|")})"\\]`, "g"))) {
    const token = match[1] as ForceableId;
    found.push({ interaction: token, id: token, label: token, probe: () => ({ kind: "force", token }) });
  }
  for (const match of selector.matchAll(/\[((?:aria|data)-[a-z-]+)(?:="([^"]*)")?\]/g)) {
    const [, name, value = ""] = match;
    const interaction = interactionOfAttribute(name);
    if (!interaction) continue;
    if (value === "false") continue;
    found.push({ interaction, id: stateName(name), label: stateName(name), probe: (element) => (element.getAttribute(name) === value ? null : { kind: "set", name, value }) });
  }
  if (EMPTY.test(selector)) {
    found.push({
      interaction: "edit",
      id: "filled",
      label: "filled",
      // Only a real text field can be typed into. `[data-placeholder]` on a Select is a symptom of nothing chosen: choosing needs a value.
      probe: (element) => (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? { kind: "text", text: "Text" } : null),
    });
  }
  return found;
}

/** The selector with what makes it a forced or recorded state removed, so it can be matched against the page in its rest state. */
const restOf = (selector: string) => selector.replace(/::placeholder/g, "").replace(/:placeholder-shown/g, "");

const matches = (element: Element, selector: string) => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

export type Found = { part: string; signal: Signal; step: Step };

/** Every rule of the sheets that is about this host's classes. The CSSOM: what DevTools' Styles panel reads. */
function relevantSelectors(host: Element, sheets: StyleSheetList): string[] {
  const classes = new Set<string>();
  host.querySelectorAll("*").forEach((element) => element.classList.forEach((name) => classes.add(name)));
  const selectors: string[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("selectorText" in rule && typeof rule.selectorText === "string") {
        if ([...classes].some((name) => (rule as CSSStyleRule).selectorText.includes(`.${name}`))) selectors.push((rule as CSSStyleRule).selectorText);
      } else if ("cssRules" in rule && rule.type !== 7) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  for (const sheet of Array.from(sheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // A cross-origin sheet is not the component's.
    }
  }
  return selectors;
}

/** The name of the part an element belongs to: its nearest `data-component`. */
const partOf = (element: Element) => element.closest("[data-component]")?.getAttribute("data-component") ?? element.tagName.toLowerCase();

/**
 * Finds where each interaction happens. The method is the physics: put the state on an element and see whether a rule starts to
 * match. The element that makes it match is the one the person acts on (the Item for `.Item:hover .Label`, not the Label). Its
 * `data-component` is the part.
 */
export function discoverFound(host: Element, sheets: StyleSheetList = document.styleSheets): Found[] {
  const elements = Array.from(host.querySelectorAll("*"));
  const found: Found[] = [];
  const seen = new Set<string>();
  for (const selector of relevantSelectors(host, sheets)) {
    for (const signal of selectorSignals(selector)) {
      if (signal.interaction === "edit") {
        const target = elements.findIndex((element) => matches(element, restOf(selector)) && signal.probe(element));
        const action = target >= 0 ? signal.probe(elements[target]) : null;
        const key = `${partOf(elements[target] ?? host)}|${signal.id}`;
        if (action && !seen.has(key)) {
          seen.add(key);
          found.push({ part: partOf(elements[target]), signal, step: { target, action } });
        }
        continue;
      }
      // A rule that already matches at rest is not one this state turns on.
      if (elements.some((candidate) => matches(candidate, selector))) continue;
      for (const [index, element] of elements.entries()) {
        const action = signal.probe(element);
        if (!action) continue;
        const undo = applied(element, action);
        const hit = elements.some((candidate) => matches(candidate, selector));
        undo();
        if (!hit) continue;
        const key = `${partOf(element)}|${signal.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ part: partOf(element), signal, step: { target: index, action } });
        }
        break;
      }
    }
  }
  addAffordances(elements, found, seen);
  return found;
}

/** What a browser lets a person tab to: these can be focused, hovered and pressed whatever the stylesheet says. */
const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

/**
 * The physics comes first: a link, a button or a field can be hovered, pressed and focused because of what it is, not because
 * a rule says so. A stylesheet only says what changes. So every focusable part gets those three, and when the rules ignore one
 * (a Link's press) its arrow is still drawn, faint, to show that nothing happens. A part that is not focusable (a Callout) gets
 * nothing it was not styled for.
 */
function addAffordances(elements: Element[], found: Found[], seen: Set<string>) {
  for (const [target, element] of elements.entries()) {
    if (!matches(element, FOCUSABLE) || matches(element, ":disabled")) continue;
    const part = partOf(element);
    for (const id of ["hover", "press", "focus"] as const) {
      const key = `${part}|${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ part, signal: { interaction: id, id, label: id, probe: () => ({ kind: "force", token: id }) }, step: { target, action: { kind: "force", token: id } } });
    }
  }
}

/** Applies an action to an element for the probe, and returns how to take it back. */
function applied(element: Element, action: Action): () => void {
  if (action.kind === "force") {
    element.setAttribute("data-force", action.token);
    return () => element.removeAttribute("data-force");
  }
  if (action.kind === "set") {
    const before = element.getAttribute(action.name);
    element.setAttribute(action.name, action.value);
    return () => (before === null ? element.removeAttribute(action.name) : element.setAttribute(action.name, before));
  }
  return () => {};
}

/** Puts an element in a state, for a picture. The inverse of nothing: each picture is its own fresh render. */
export function applyStep(elements: Element[], step: Step) {
  const element = elements[step.target];
  if (!element) return;
  const { action } = step;
  if (action.kind === "force") {
    const tokens = new Set((element.getAttribute("data-force") ?? "").split(" ").filter(Boolean));
    tokens.add(action.token);
    element.setAttribute("data-force", [...tokens].join(" "));
  } else if (action.kind === "set") element.setAttribute(action.name, action.value);
  else if (action.kind === "unset") element.removeAttribute(action.name);
  else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.value = action.text;
}

/** The order pointer and keyboard states are reached in. */
const POINTER = ["hover", "press"] as const;

const REST: State = { id: "rest", label: "rest", apply: [] };

/**
 * Turns what one part reacts to into states and arrows. `rest` is always there. A press happens on top of a hover (the pointer is
 * over what it presses), so it follows hover when both exist; focus and every other state is reached from rest. The state an
 * attribute or the empty field records is named for it ("expanded", "filled").
 */
export function modelFromFound(found: Found[]): StateModel {
  const byId = new Map(found.map((entry) => [entry.signal.id, entry]));
  const states: State[] = [REST];
  const interactions: StateModel["interactions"] = [];
  const add = (entry: Found, from: string, apply: Step[]) => {
    states.push({ id: entry.signal.id, label: entry.signal.label, apply });
    interactions.push({ id: entry.signal.interaction, label: def(entry.signal.interaction).label, from, to: entry.signal.id, target: entry.step.target });
  };
  let pointerEnd = "rest";
  for (const id of POINTER) {
    const entry = byId.get(id);
    if (!entry) continue;
    const hover = byId.get("hover");
    add(entry, pointerEnd, id === "press" && hover ? [hover.step, entry.step] : [entry.step]);
    pointerEnd = id;
  }
  for (const entry of found) {
    if (entry.signal.id === "hover" || entry.signal.id === "press") continue;
    add(entry, "rest", [entry.step]);
  }
  return { states, interactions };
}

/** Groups what was found by part. The component itself comes first; a part with nothing to react to still has its rest. */
export function discoverParts(host: Element, name: string, sheets?: StyleSheetList): PartModel[] {
  const found = discoverFound(host, sheets);
  const parts = new Map<string, Found[]>([[name, []]]);
  for (const entry of found) parts.set(entry.part, [...(parts.get(entry.part) ?? []), entry]);
  return [...parts.entries()].sort(([a], [b]) => (a === name ? -1 : b === name ? 1 : a.localeCompare(b))).map(([part, entries]) => ({ part, model: modelFromFound(entries) }));
}
