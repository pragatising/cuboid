import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { Prop } from "../Interfaces/ComponentModel/Prop";
import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";
import { allElements } from "../extract/printModel";
import { flowEdges, spreadsProps } from "./flow";
import { HTML, ROW_GROUPS, holderIn, mayHold } from "../content/html";
import { roleOf, rootHostOf, slotChains, supportsAria } from "./role";
import type { ComponentDoc, PartDoc, PropDoc } from "../types";

/** Every component read, by where it is written (`ComponentModel.declared`). */
export type Models = Record<string, ComponentModel>;

export type Recognised = {
  /** What the examples engine varies: each prop, with what kind of value it takes. */
  doc: ComponentDoc;
  /** Props that mean "cannot be used right now". An example turns on at most one. */
  conditions: string[];
  /** Slots shown only in a scenario of their own (an empty list, say). */
  scenarios: string[];
  /** Props that are state the app holds: `x`, `defaultX` and `onXChange` together. */
  state: string[];
  /** Whether it takes content though its own types do not declare `children`. */
  contentFromNative: boolean;
};

/** Splits `a | b | Foo<x | y>` at the top level only. */
function splitUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of type) {
    if ("<({[".includes(char)) depth += 1;
    else if (">)}]".includes(char)) depth -= 1;
    if (char === "|" && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  parts.push(current.trim());
  return parts;
}

const STRING = /^"(?:[^"\\]|\\.)*"$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
const MAX_VALUES = 24;

/** What kind of value a prop takes, read from its type as the checker printed it. The same kinds `components.json` uses. */
export function propDoc(prop: Prop): PropDoc {
  const base = { name: prop.name, required: prop.required, ...(prop.default !== undefined ? { default: prop.default } : {}) };
  const members = splitUnion(prop.type).filter((m) => m !== "undefined" && m !== "null");
  if (prop.name === "ref" || /^(React\.)?(Ref|RefObject|MutableRefObject|LegacyRef)\b/.test(prop.type)) return { ...base, kind: "ref" };
  if (members.length && members.every((m) => ["boolean", "true", "false"].includes(m))) return { ...base, kind: "flag" };
  if (members.length && members.every((m) => STRING.test(m) || NUMBER.test(m))) {
    const values = members.map((m) => (STRING.test(m) ? (JSON.parse(m) as string) : Number(m)));
    return values.length <= MAX_VALUES ? { ...base, kind: "enum", values } : { ...base, kind: "open" };
  }
  if (members.some((m) => m.includes("=>"))) return { ...base, kind: /^on[A-Z]/.test(prop.name) ? "event" : "function" };
  if (/ReactNode|ReactElement/.test(prop.type)) return { ...base, kind: "slot" };
  if (members.some((m) => STRING.test(m)) && members.includes("string")) return { ...base, kind: "open" };
  if (members.length && members.every((m) => m === "string" || m === "number")) return { ...base, kind: "value" };
  return { ...base, kind: /^on[A-Z]/.test(prop.name) ? "event" : "other" };
}

const capital = (name: string) => name[0].toUpperCase() + name.slice(1);

/** `x`, `defaultX` and `onXChange` are one piece of state the app can hold, or leave to the component. */
function stateNames(props: Prop[]): string[] {
  const names = new Set(props.map((p) => p.name));
  return props
    .map((p) => p.name)
    .filter((x) => names.has(`default${capital(x)}`) && names.has(`on${capital(x)}Change`))
    .flatMap((x) => [x, `default${capital(x)}`, `on${capital(x)}Change`]);
}

/**
 * The attributes that put a control in a scenario of its own: unavailable (`disabled`, `aria-disabled`), not editable (`readOnly`,
 * `aria-readonly`), busy (`aria-busy`) or in error (`aria-invalid`). HTML and ARIA define them. A control is in one scenario at a time,
 * which is what separates them from the states a person toggles (`aria-pressed`, `aria-expanded`, `aria-checked`).
 */
const CONDITION_ATTRIBUTES = new Set(["disabled", "aria-disabled", "readOnly", "aria-readonly", "aria-busy", "aria-invalid"]);
/** Props the platform itself defines on a control as making it unusable: HTML says what `disabled` and `readOnly` do. */
const NATIVE_CONDITIONS = ["disabled", "readOnly"];

/**
 * The names in a component (props, and what is derived from them) that reach an attribute saying "cannot be used right now",
 * following each name through the locals and hook results that read it. A component it hands its props to is followed too: a
 * name it treats as a condition is one here, when this one passes it on (by name, or by spreading its props).
 */
function conditionNames(model: ComponentModel, models: Models, visited = new Set<string>()): Set<string> {
  if (visited.has(model.declared)) return new Set();
  visited.add(model.declared);

  const derived = flowEdges(model, models);
  const role = roleOf(model, models);
  // `aria-invalid` on a button means nothing; a role takes the attributes the standard lists for it (HTML's own `disabled` is always fine).
  const counts = (attribute: string) => !attribute.startsWith("aria-") || supportsAria(role, attribute);

  const sinks = new Set<string>();
  const passedOn: { names: string[]; carries: Set<string> }[] = [];
  for (const element of allElements(model)) {
    for (const attribute of element.attributes) {
      if (attribute.kind === "attribute" && CONDITION_ATTRIBUTES.has(attribute.name) && counts(attribute.name) && typeof attribute.value === "object") for (const r of attribute.value.reads) sinks.add(r.name);
      // A props object built in code (`{...mergeProps(…, { "aria-disabled": busy })}`) sets attributes too.
      const written = attribute.kind === "spread" ? attribute.value : typeof attribute.value === "object" ? attribute.value : undefined;
      for (const property of written?.properties ?? []) if (CONDITION_ATTRIBUTES.has(property.key) && counts(property.key)) for (const r of [...property.reads, ...property.guards]) sinks.add(r.name);
    }
    if (element.type.kind !== "component" || !element.type.declared || !models[element.type.declared]) continue;
    const inner = conditionNames(models[element.type.declared], models, visited);
    for (const attribute of element.attributes) {
      if (attribute.kind === "attribute" && inner.has(attribute.name) && typeof attribute.value === "object") for (const r of attribute.value.reads) sinks.add(r.name);
    }
    if (spreadsProps(element, model)) passedOn.push({ names: model.props.map((p) => p.name), carries: inner });
  }

  const reaches = (name: string): boolean => {
    const seen = new Set<string>();
    const stack = [name];
    for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
      if (sinks.has(next)) return true;
      if (seen.has(next)) continue;
      seen.add(next);
      stack.push(...(derived.get(next) ?? []));
    }
    return false;
  };

  const found = new Set<string>();
  const everyName = new Set([...derived.keys(), ...[...derived.values()].flatMap((v) => [...v]), ...sinks, ...model.props.map((p) => p.name)]);
  for (const name of everyName) if (reaches(name)) found.add(name);
  for (const { names, carries } of passedOn) for (const name of names) if (carries.has(name)) found.add(name);
  return found;
}

/** Whether the component hands its props to some element, so the caller's native props (`children`, `disabled`) land on it. */
const reachesHost = (model: ComponentModel) => allElements(model).some((element) => spreadsProps(element, model));

/** Elements that cannot have content between their tags. */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/**
 * Whether a component takes content. Any of: its parameter or types name `children`; its tree puts `children` somewhere (`{children}`
 * between tags: Box, Heading, Text destructure it in the body, so the parameter does not say it); or it hands its props as a whole
 * to an element that has no children of its own (an explicit child wins over `props.children`) and can hold content (a `div`, a
 * tag chosen in code), or to a component that takes content, which is followed. Callout spreads its props into Box, which places `children`.
 */
function takesContent(model: ComponentModel, models: Models, visited = new Set<string>()): boolean {
  if (visited.has(model.declared)) return false;
  visited.add(model.declared);
  if (model.props.some((p) => p.name === "children") || model.params[0]?.bindings.some((b) => b.name === "children" && !b.rest)) return true;
  const elements = allElements(model);
  // `{children}`, or `{items}` where `const items = Children.toArray(children)`: anything made from `children` that the tree places.
  const edges = flowEdges(model);
  const fromChildren = new Set(["children"]);
  for (const name of fromChildren) for (const next of edges.get(name) ?? []) fromChildren.add(next);
  if (elements.some((e) => e.children.some((c) => c.kind === "expression" && c.expr.reads.some((r) => fromChildren.has(r.name))))) return true;
  return elements.some((element) => {
    if (element.children.length > 0 || !spreadsProps(element, model)) return false;
    if (element.type.kind === "host") return !VOID.has(element.type.host.tag);
    if (element.type.kind !== "component") return false;
    // `<Component …>` where `const Component = as ?? "div"`: a tag chosen in code, which is a host that can hold content.
    const tag = element.type.name;
    if (!element.type.declared && model.locals.some((l) => l.names.includes(tag))) return true;
    const inner = element.type.declared ? models[element.type.declared] : undefined;
    return inner ? takesContent(inner, models, visited) : false;
  });
}

/** The elements a component's children can sit in, as far as HTML goes: one, or several when it places them by prop. Empty when it cannot be told. */
function holdersOf(model: ComponentModel, models: Models): string[] {
  const holders = slotChains(model, models, "children").flatMap((chain) => holderIn(chain) ?? []);
  return [...new Set(holders)];
}

/**
 * The parts a compound component carries (its statics), each read from its own model: its role from the standard, so an item (a
 * `menuitem`) is told from what holds items (a `menu`); and where HTML says it goes. A part that renders an `li` must be inside the
 * part that renders the `ul`, a `td` inside the one that renders the `tr`; a part nothing the component renders can hold (a `div` in a
 * `table`) is not placeable. Where HTML cannot say, the standard's container is used.
 */
export function partsOf(model: ComponentModel, models: Models): PartDoc[] {
  const read = model.statics.flatMap((item) => {
    const part = item.declared ? models[item.declared] : undefined;
    if (!part) return [];
    const role = roleOf(part, models);
    const element = rootHostOf(part, models)?.tag;
    return [{ item, part, role, element: element && HTML[element] ? element : null, holds: holdersOf(part, models)[0] }];
  });
  const itemRoles = new Set(read.filter(({ role }) => role?.within.length).flatMap(({ role }) => role?.roles ?? []));
  const parts: PartDoc[] = read.map(({ item, part, role, holds, element }) => ({
    tag: `${model.name}.${item.name}`,
    name: item.name,
    item: !!role?.within.length || part.props.some((p) => p.required && p.name === "value"),
    container: !!role?.owns.some((owned) => itemRoles.has(owned)),
    content: takesContent(part, models),
    required: part.props.filter((p) => p.required).map(propDoc),
    placeable: true,
    ...(holds ? { holds } : {}),
    ...(element ? { element } : {}),
    ...(element && (HTML[element].unique || ROW_GROUPS.includes(element)) ? { once: true } : {}),
    ...(element && HTML[element].belongsIn ? { belongsIn: HTML[element].belongsIn } : {}),
  }));

  const owner = holdersOf(model, models);
  const inside = new Map<string, string>();
  const within = (tag: string, ancestor: string): boolean => tag === ancestor || (inside.has(tag) && within(inside.get(tag) as string, ancestor));
  read.forEach(({ element, item }, index) => {
    const part = parts[index];
    if (!element || !owner.length) {
      const container = item ? parts.find((p) => p.container && p !== part) : undefined;
      if (container) inside.set(part.tag, container.tag);
      return;
    }
    // A part with a parent it requires goes in the part that is that parent; any other goes in the component, if it holds it.
    const required = HTML[element].parents;
    const holders = required ? parts.filter((other, i) => other !== part && other.holds && required.includes(other.holds) && mayHold(other.holds, element) && !within(other.tag, part.tag) && read[i].element !== element) : [];
    const [holder, ...others] = holders;
    if (holder) {
      inside.set(part.tag, holder.tag);
      if (others.length) part.alsoInside = others.map((other) => other.tag);
    }
    else if (!owner.some((holder) => mayHold(holder, element))) part.placeable = false;
  });
  for (const part of parts) if (inside.has(part.tag)) part.inside = inside.get(part.tag);
  return parts;
}

/** Slots the component puts props on by cloning what it is given (`cloneElement(trigger, {…})`): they must be one element. */
function elementSlots(model: ComponentModel): string[] {
  const props = new Set(model.props.map((p) => p.name));
  return model.locals
    .flatMap((local) => local.calls)
    .filter((call) => /(^|\.)cloneElement$/.test(call.callee.source))
    .flatMap((call) => call.arguments[0]?.reads.map((r) => r.name) ?? [])
    .filter((name) => props.has(name));
}

/** A button the library has: one that takes content and needs nothing else. It is what goes in a slot that wants an interactive element. */
function buttonOf(models: Models, exported: Record<string, string>): { tag: string } | null {
  for (const [name, declared] of Object.entries(exported)) {
    const candidate = models[declared];
    if (candidate && roleOf(candidate, models)?.role === "button" && takesContent(candidate, models) && !candidate.props.some((p) => p.required && p.name !== "children")) return { tag: name };
  }
  return null;
}

/**
 * Slots shown only under a condition the slot does not decide on its own: `{showEmpty ? empty : null}` where `showEmpty` is made from
 * `empty` and also from `loading` and the items. An optional slot guarded only by itself (`description && …`), or by other slots it
 * shares a wrapper with, is not one. These are scenarios (nothing to show) and, like the conditions, one at a time.
 */
function scenarioSlots(model: ComponentModel, models: Models, conditions: string[]): string[] {
  const allSlots = new Set(model.props.filter((p) => propDoc(p).kind === "slot").map((p) => p.name));
  const slots = [...allSlots].filter((name) => name !== "children");
  if (!slots.length) return [];
  const sources = new Map<string, Set<string>>();
  for (const [source, names] of flowEdges(model, models)) for (const name of names) sources.set(name, (sources.get(name) ?? new Set()).add(source));
  const props = new Set(model.props.map((p) => p.name));
  const flags = new Set(model.props.filter((p) => propDoc(p).kind === "flag").map((p) => p.name));
  const propsBehind = (name: string) => {
    const seen = new Set([name]);
    for (const next of seen) for (const source of sources.get(next) ?? []) seen.add(source);
    return [...seen].filter((n) => props.has(n));
  };

  const found = new Set<string>();
  for (const element of allElements(model)) {
    const written = [
      ...element.attributes.map((a) => (a.kind === "spread" ? a.value : typeof a.value === "object" ? a.value : undefined)),
      ...element.children.map((c) => (c.kind === "expression" ? c.expr : undefined)),
    ];
    for (const expr of written)
      for (const branch of expr?.branches ?? [])
        for (const slot of slots) {
          if (!branch.consequent.some((r) => propsBehind(r.name).includes(slot))) continue;
          const deciding = new Set(branch.test.flatMap((r) => propsBehind(r.name)));
          // Decided by a flag or a scenario (`loading`), not just by other slots it shares a wrapper with (`heading`, `description`) or by a
          // look (`layout`): showing less in a compact layout is not a scenario.
          if ([...deciding].some((name) => name !== slot && (flags.has(name) || conditions.includes(name)))) found.add(slot);
        }
  }
  return [...found];
}

/**
 * Reads a component's model for what each input does, and nothing the model does not hold: what kind of value each prop takes,
 * which are state the app holds, which mean "cannot be used right now", and whether it takes content its types do not declare.
 */
export function recognise(model: ComponentModel, models: Models, exported: Record<string, string> = {}): Recognised {
  const state = stateNames(model.props);
  const docs = model.props.map((prop) => (state.includes(prop.name) ? { ...propDoc(prop), kind: "state" } : propDoc(prop)));
  // `children` is React's own name for content. A component that takes content takes it whether or not its own types declare it (a
  // polymorphic type often cannot be read, and a component that spreads its props on takes what the next one takes).
  const contentFromNative = !model.props.some((p) => p.name === "children") && takesContent(model, models);
  if (contentFromNative) docs.push({ name: "children", required: false, kind: "slot" });

  // A slot the component clones props onto wants one interactive element, not text.
  const button = buttonOf(models, exported);
  for (const name of elementSlots(model)) {
    const doc = docs.find((d) => d.name === name);
    if (doc && doc.kind === "slot") {
      doc.element = true;
      if (button) doc.filler = { tag: button.tag, children: ["Trigger"] };
    }
  }

  // A role named by its author (a textbox, a combobox, a switch) must be given a name, and where the component has a slot that lands
  // in a `label` that is where it comes from: WCAG 4.1.2 (name, role, value) and 3.3.2 (labels) need it, so an example always has it.
  const role = roleOf(model, models);
  if (role?.nameFrom.includes("author"))
    for (const doc of docs)
      if (doc.kind === "slot" && doc.name !== "children" && slotChains(model, models, doc.name).some((chain) => chain.includes("label"))) doc.names = true;

  const conditions = new Set(conditionNames(model, models));
  const own = model.props.map((p) => p.name);
  const found = own.filter((name) => conditions.has(name) || (NATIVE_CONDITIONS.includes(name) && reachesHost(model)));
  return { doc: { name: model.name, props: docs, parts: partsOf(model, models) }, conditions: found, scenarios: scenarioSlots(model, models, found), state, contentFromNative };
}
