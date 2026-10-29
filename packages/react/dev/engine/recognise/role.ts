import { elementRoles as ariaElementRoles, roles as ariaRoles } from "aria-query";
import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { Expr } from "../Interfaces/ComponentModel/Expr";
import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";
import { flowEdges, spreadsProps } from "./flow";
import type { Models } from "./recognise";

/** What the platform says a component is: its ARIA role, read from the element that carries its meaning. */
export type Role = {
  /** `button`, `switch`, `banner`, `textbox`…; `generic` when nothing says more. */
  role: string;
  /** Whether the code names the role (`role="switch"`) or the element implies it (`<header>`, `<nav>`). */
  source: "explicit" | "implicit";
  /** The tag the role was read from. */
  host: string;
  /** From the role's ancestry in the standard: a widget is a control, a landmark a region of the page, a window a dialog, structure a block of content. */
  category: "widget" | "landmark" | "window" | "structure" | "generic" | "other";
  /** Every role the code names for the element, when it chooses between them (`isOption ? "option" : "menuitem"`); the first is `role`. */
  roles: string[];
  /** Where the standard says its accessible name comes from: `author` (a label is needed), `contents`. */
  nameFrom: string[];
  /** The roles it must contain, per the standard: a `menu` owns `menuitem`s, a `listbox` owns `option`s. */
  owns: string[];
  /** The roles it must sit inside, per the standard: a `menuitem` in a `menu`, an `option` in a `listbox`, a `cell` in a `row`. Non-empty for an item of something. */
  within: string[];
};

// The shapes `aria-query` has at runtime; its published types describe them differently, so they are written down here.
type ElementKey = { name: string; attributes?: { name: string; value?: string; constraints?: string[] }[] };
type RoleDefinition = { superClass?: string[][]; nameFrom?: string[]; requiredOwnedElements?: string[][]; requiredContextRole?: string[]; props?: Record<string, unknown> };
const elementRoles = ariaElementRoles as unknown as { entries(): Iterable<[ElementKey, string[]]> };
const roles = ariaRoles as unknown as { get(role: string): RoleDefinition | undefined; has(role: string): boolean };

type Attributes = Record<string, string | null>;
/** A host element a component renders. `tags` has more than one when the code chooses between them. */
type Host = {
  tags: string[];
  attrs: Attributes;
  /** Whether it is the element the caller's props land on. */
  primary: boolean;
  /** Roles the code names where it sets `role` from something it computes. */
  roleChoices: string[];
};

/** The attributes an element writes as literals; `null` for one set by code (present, but its value is not known). */
function literalAttributes(element: TreeElement): Attributes {
  const attrs: Attributes = {};
  for (const attribute of element.attributes) {
    if (attribute.kind !== "attribute") continue;
    if (attribute.value === undefined) attrs[attribute.name] = "";
    else if (typeof attribute.value === "string") attrs[attribute.name] = attribute.value;
    else {
      const quoted = /^(["'])(.*)\1$/.exec(attribute.value.source.trim());
      attrs[attribute.name] = quoted ? quoted[2] : null;
    }
  }
  return attrs;
}

/** The ARIA roles a piece of code names in quotes, in order. */
const rolesNamedIn = (text: string) => [...text.matchAll(/["']([a-z]+)["']/g)].map((m) => m[1]).filter((name) => roles.has(name));

/**
 * The roles an element's `role` can be when the code computes it: `role={single ? "menuitemradio" : "menuitem"}`, or `role` in a props
 * object built from a local (`const role = isOption ? "option" : "menuitem"`) or from a parameter's default (`role = "menu"`).
 */
function roleChoicesOf(element: TreeElement, model: ComponentModel): string[] {
  const reads: { source: string; names: string[] }[] = [];
  for (const attribute of element.attributes) {
    if (attribute.kind === "attribute" && attribute.name === "role" && typeof attribute.value === "object") reads.push({ source: attribute.value.source, names: attribute.value.reads.map((r) => r.name) });
    const written = attribute.kind === "spread" ? attribute.value : typeof attribute.value === "object" ? attribute.value : undefined;
    for (const property of written?.properties ?? []) if (property.key === "role") reads.push({ source: "", names: property.reads.map((r) => r.name) });
  }
  const found: string[] = [];
  for (const { source, names } of reads) {
    found.push(...rolesNamedIn(source));
    for (const name of names) {
      const fallback = model.params.flatMap((p) => p.bindings).find((b) => b.name === name)?.default;
      if (fallback) found.push(...rolesNamedIn(fallback));
      const local = model.locals.find((l) => l.names.includes(name));
      if (local) found.push(...rolesNamedIn(local.source));
    }
  }
  return [...new Set(found)];
}

/** Every outermost element a component can return: both sides of `native ? <NativeSelect /> : <PopupSelect />`. */
const alternatives = (model: ComponentModel): TreeElement[] =>
  model.returns.flatMap(({ value }) => (value.kind === "element" ? [value.element] : value.kind === "expression" ? value.expr.elements : []));

/** The outermost element of each return. */
const roots = (model: ComponentModel): TreeElement[] =>
  model.returns.flatMap(({ value }) => (value.kind === "element" ? [value.element] : value.kind === "expression" ? value.expr.elements.slice(0, 1) : []));

const TAGS = new Set<string>([...[...elementRoles.entries()].map(([key]) => key.name), "div", "span", "section", "aside", "ul", "ol", "li", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label"]);

/** `<Component>` where `const Component = as ?? "div"`: the tags the code chooses between, read from that declaration. */
function chosenTags(model: ComponentModel, name: string): string[] {
  const local = model.locals.find((l) => l.names.includes(name));
  if (!local) return [];
  return [...new Set([...local.source.matchAll(/["']([a-z][a-z0-9]*)["']/g)].map((m) => m[1]).filter((tag) => TAGS.has(tag)))];
}

/**
 * The host elements a component renders, in tree order, following a component it renders to the elements it renders. A caller's
 * literal attributes land on the root of what it calls (`<ButtonBase as="button">` makes that root a `button`).
 */
function* hostsOf(model: ComponentModel, models: Models, carried: Attributes, visited: Set<string>): Generator<Host> {
  if (visited.has(model.declared)) return;
  const seen = new Set(visited).add(model.declared);
  let first = true;
  for (const element of roots(model)) {
    yield* hostsIn(element, model, models, first ? carried : {}, seen);
    first = false;
  }
}

function* hostsIn(element: TreeElement, model: ComponentModel, models: Models, carried: Attributes, visited: Set<string>): Generator<Host> {
  const attrs = { ...literalAttributes(element), ...carried };
  const primary = spreadsProps(element, model);
  const roleChoices = roleChoicesOf(element, model);
  if (element.type.kind === "host") yield { tags: [element.type.host.tag], attrs, primary, roleChoices };
  else if (element.type.kind === "component") {
    const as = typeof attrs.as === "string" ? attrs.as : undefined;
    const inner = element.type.declared ? models[element.type.declared] : undefined;
    if (as) yield { tags: [as], attrs, primary, roleChoices };
    else if (inner) {
      // What the called component renders is the caller's element only if the caller hands its whole props on to it.
      for (const host of hostsOf(inner, models, attrs, visited)) yield { ...host, primary: host.primary && primary, roleChoices: host.roleChoices.length ? host.roleChoices : roleChoices };
    } else {
      const tags = chosenTags(model, element.type.name);
      if (tags.length) yield { tags, attrs, primary, roleChoices };
    }
  }
  const nested = element.children.flatMap((child) => (child.kind === "element" ? [child.element] : child.kind === "expression" ? child.expr.elements : []));
  for (const child of nested) yield* hostsIn(child, model, models, {}, visited);
}

/** The first host element a component renders: the element it is, as far as HTML goes. Its literal attributes are what the caller wrote (`as`). */
export function rootHostOf(model: ComponentModel, models: Models, attrs: Attributes = {}): { tag: string; attrs: Attributes } | null {
  const first = hostsOf(model, models, attrs, new Set()).next();
  return first.done ? null : { tag: first.value.tags[0], attrs: first.value.attrs };
}

/**
 * Every place a slot can land: for each, the host elements from the component's root down to the one that holds it (`button` › `span`
 * › `span`). That is where what a caller puts in `leadingVisual` actually lands in HTML. The slot is followed through what is made from
 * it (`const leading = loading ? … : leadingVisual`) and through the components it is handed on to, by name when the props are spread,
 * or by the attribute that carries it. More than one when the component places it differently by prop (Select puts options in a native
 * `<select>` or in a popup list). Empty when it cannot be found.
 */
export function slotChains(model: ComponentModel, models: Models, slot: string, carried: Attributes = {}, visited: Set<string> = new Set(), base: string[] = []): string[][] {
  if (visited.has(model.declared)) return [];
  const seen = new Set(visited).add(model.declared);
  const edges = flowEdges(model, models);
  const names = new Set([slot]);
  for (const name of names) for (const next of edges.get(name) ?? []) names.add(next);
  const reads = (expr: Expr) => expr.reads.some((r) => names.has(r.name));
  // A prop taken out by name (`{ children, ...props }`) is not among the props that are spread on.
  const taken = model.params.some((param) => param.bindings.some((b) => !b.rest && (b.key ?? b.name) === slot));

  const walk = (element: TreeElement, chain: string[], carry: Attributes): string[][] => {
    const attrs = { ...literalAttributes(element), ...carry };
    let here = chain;
    // Where what is written between this element's tags lands: its own tag, or for a component, where that component puts its `children`.
    let homes: string[][] | undefined;
    const found: string[][] = [];
    const holds = element.children.some((c) => c.kind === "expression" && reads(c.expr));
    if (element.type.kind === "host") here = [...chain, element.type.host.tag];
    else if (element.type.kind === "component") {
      const as = typeof attrs.as === "string" ? attrs.as : undefined;
      const inner = element.type.declared ? models[element.type.declared] : undefined;
      if (inner) {
        // The component's own tree is where the slot goes; `as` reaches its root through `attrs`.
        const carrier = element.attributes.find((a) => a.kind === "attribute" && typeof a.value === "object" && reads(a.value));
        const through = carrier?.kind === "attribute" ? carrier.name : spreadsProps(element, model) && !taken ? slot : undefined;
        if (through) found.push(...slotChains(inner, models, through, attrs, seen, chain));
        // Content between this component's tags is its `children`.
        const inside = element.children.length ? slotChains(inner, models, "children", attrs, seen, chain).filter((c) => c.length > 0) : [];
        if (inside.length) homes = inside;
        if (holds) found.push(...(inside.length ? inside : [chain]));
      } else if (as) here = [...chain, as];
      else {
        const tags = chosenTags(model, element.type.name);
        if (tags.length) here = [...chain, tags[0]];
      }
    }
    // `children` handed to an element through the props it spreads (`<Component {...props} />`) is that element's content.
    if (slot === "children" && element.children.length === 0 && !taken && spreadsProps(element, model) && (element.type.kind === "host" || (element.type.kind === "component" && !element.type.declared))) found.push(here);
    // The innermost element that holds it: look inside what is written in the expressions first.
    const nested = element.children.flatMap((c) => (c.kind === "element" ? [c.element] : c.kind === "expression" ? c.expr.elements : []));
    const deeper = (homes ?? [here]).flatMap((home) => nested.flatMap((child) => walk(child, home, {})));
    // Elements written in an attribute (`trigger={<InputText {...props} />}`) are what the component puts where that prop goes.
    for (const attribute of element.attributes) {
      if (attribute.kind !== "attribute" || typeof attribute.value !== "object" || attribute.value.elements.length === 0) continue;
      const inner = element.type.kind === "component" && element.type.declared ? models[element.type.declared] : undefined;
      const where = inner ? slotChains(inner, models, attribute.name, {}, seen, here).filter((c) => c.length > 0) : [];
      for (const home of where.length ? where : [here]) for (const child of attribute.value.elements) deeper.push(...walk(child, home, {}));
    }
    found.push(...deeper);
    if (holds && element.type.kind !== "component" && deeper.length === 0) found.push(here);
    else if (holds && element.type.kind === "component" && !element.type.declared && deeper.length === 0) found.push(here);
    return found;
  };

  const all: string[][] = [];
  let first = true;
  for (const element of alternatives(model)) {
    all.push(...walk(element, base, first ? carried : {}));
    first = false;
  }
  const unique = new Map(all.map((chain) => [chain.join(">"), chain]));
  return [...unique.values()];
}

type Found = { role: string; source: "explicit" | "implicit"; tag: string; alternatives: string[] };

/** The role of an element: the one it says, or the one its tag (and the attributes it writes) implies. Of several tags, one that says something. */
function roleOfHost({ tags, attrs, roleChoices }: Host): Found | null {
  const named = typeof attrs.role === "string" ? attrs.role.trim().split(/\s+/)[0] : undefined;
  if (named && roles.has(named)) return { role: named, source: "explicit", tag: tags[0], alternatives: [named] };
  if (roleChoices.length) return { role: roleChoices[0], source: "explicit", tag: tags[0], alternatives: roleChoices };

  let best: (Found & { score: number }) | null = null;
  for (const tag of tags)
    for (const [key, implied] of elementRoles.entries()) {
      if (key.name !== tag) continue;
      let score = 0;
      let fits = true;
      for (const attribute of key.attributes ?? []) {
        const present = attribute.name in attrs;
        if (attribute.value !== undefined) fits &&= attrs[attribute.name] === attribute.value;
        else if (attribute.constraints?.includes("set")) fits &&= present;
        else if (attribute.constraints?.includes("undefined")) fits &&= !present;
        score += 1;
      }
      const role = implied[0];
      // The most specific entry that fits; at a tie, one that says something over `generic`.
      if (fits && role && (!best || (best.role === "generic" && role !== "generic") || (score > best.score && role !== "generic") || (score === best.score && best.role === "generic")))
        best = { role, source: "implicit", tag, score, alternatives: [role] };
    }
  // An `input` whose type the code sets is a text field unless the type says otherwise: that is HTML's own fallback for a type it does not know.
  if (!best && tags.includes("input")) return { role: "textbox", source: "implicit", tag: "input", alternatives: ["textbox"] };
  return best ? { role: best.role, source: best.source, tag: best.tag, alternatives: [best.role] } : null;
}

const categoryOf = (role: string): Role["category"] => {
  if (role === "generic") return "generic";
  const ancestry = new Set((roles.get(role)?.superClass ?? []).flat());
  return (["widget", "landmark", "window", "structure"] as const).find((c) => ancestry.has(c)) ?? "other";
};

const cache = new WeakMap<Models, Map<string, Role | null>>();

/**
 * Whether an ARIA attribute is one the component's role supports, per the standard (`textbox` takes `aria-invalid`, `button` does not).
 * With no role to judge by, or only `generic`, it is not ruled out.
 */
export function supportsAria(role: Role | null, attribute: string): boolean {
  if (!role || role.role === "generic") return true;
  return role.roles.some((name) => attribute in (roles.get(name)?.props ?? {}));
}

const BLANK = ["generic", "none", "presentation"];

/**
 * A component's role: that of the element the caller's props land on (the element that *is* the component, as far as a caller can
 * tell); failing that, of the first element it renders that has one other than `generic`, `none` or `presentation`. Null when it
 * renders no element it can read.
 */
export function roleOf(model: ComponentModel, models: Models): Role | null {
  const memo = cache.get(models) ?? new Map<string, Role | null>();
  cache.set(models, memo);
  if (memo.has(model.declared)) return memo.get(model.declared) ?? null;

  const hosts = [...hostsOf(model, models, {}, new Set())];
  const primary = hosts.find((h) => h.primary);
  // The element the caller's props land on is the component, whatever role it has. With none, the first element that says something.
  const chosen = primary ?? hosts.find((h) => {
    const role = roleOfHost(h);
    return role && !BLANK.includes(role.role);
  });
  const found = chosen ? roleOfHost(chosen) : null;
  let result: Role | null = null;
  if (found) {
    const definitions = found.alternatives.map((name) => roles.get(name));
    result = {
      role: found.role,
      source: found.source,
      host: found.tag,
      category: categoryOf(found.role),
      roles: found.alternatives,
      nameFrom: roles.get(found.role)?.nameFrom ?? [],
      owns: [...new Set(definitions.flatMap((d) => (d?.requiredOwnedElements ?? []).flat()))],
      within: [...new Set(definitions.flatMap((d) => d?.requiredContextRole ?? []))],
    };
  } else if (chosen ?? hosts[0]) result = { role: "generic", source: "implicit", host: (chosen ?? hosts[0]).tags[0], category: "generic", roles: ["generic"], nameFrom: [], owns: [], within: [] };
  memo.set(model.declared, result);
  return result;
}
