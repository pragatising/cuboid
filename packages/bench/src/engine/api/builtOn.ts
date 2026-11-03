import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";
import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";

/** A value a component sets on what it is built on, as the code writes it: `direction="column"`, `background={theme.surface}`. */
export type Fixed = { name: string; value: string };

/**
 * What a component does with one prop of the component it is built on:
 * - `wrapped`: it takes the prop itself and passes its own on (a menu takes `open` and `onOpenChange`, keeps its own state, and writes `open={open}` on the overlay it is built on);
 * - `fixed`: it decides, and the caller cannot (`autoFocus={false}`, written after `{...props}`);
 * - `default`: it says a value, and the caller's own, which comes after, wins (a panel's `direction="column"`).
 */
export type How = "wrapped" | "fixed" | "default";
export type Setting = Fixed & { how: How };

/** The component a component is built on, and what it writes on it. */
export type BuiltOn = { on: string; declared?: string; fixed: Fixed[]; settings: Setting[] };

/** The element a component is built on: what it returns, past the wrappers that draw nothing of their own (a context's `Provider`, a fragment). */
function builtOnElement(element: TreeElement): TreeElement | undefined {
  const wrapper = element.type.kind === "fragment" || (element.type.kind === "component" && element.type.name.endsWith(".Provider"));
  if (!wrapper) return element;
  const inside = element.children.find((child) => child.kind === "element");
  return inside?.kind === "element" ? builtOnElement(inside.element) : undefined;
}

/**
 * What a component writes on the component it is built on, as the code says it: a panel that returns `<Layout direction="column" background={…}>`
 * makes those its own choices. Each is `wrapped`, `fixed` or a `default`, from the props the component takes itself and from where
 * `{...props}` sits among the attributes (later wins). Null when the component renders host elements or several things.
 */
export function builtOn(model: ComponentModel | undefined): BuiltOn | null {
  const returned = model?.returns[0]?.value;
  const element = returned?.kind === "element" ? builtOnElement(returned.element) : undefined;
  if (!model || !element || element.type.kind !== "component") return null;
  const type = element.type;
  const taken = new Set((model.params[0]?.bindings ?? []).filter((binding) => !binding.rest).map((binding) => binding.key ?? binding.name));
  const attributes = element.attributes;
  const lastSpread = attributes.map((attribute) => attribute.kind).lastIndexOf("spread");
  const settings = attributes.flatMap((attribute, index): Setting[] => {
    if (attribute.kind !== "attribute") return [];
    const { value } = attribute;
    const text = value === undefined ? "true" : typeof value === "string" ? JSON.stringify(value) : value.source;
    // The caller's props come where `{...props}` is: what is written after it is the component's, whatever the caller says; before it, a default.
    const how: How = taken.has(attribute.name) ? "wrapped" : lastSpread > index ? "default" : "fixed";
    return [{ name: attribute.name, value: text, how }];
  });
  return settings.length ? { on: type.name, declared: type.declared, fixed: settings.map(({ name, value }) => ({ name, value })), settings } : null;
}

/**
 * The host element a component finally is: what it returns, past wrappers that draw nothing, and when that is another component, what that is, until a tag
 * (`nav`, `div`) is reached. `resolve` finds the model of a component by where it is written. Undefined when it renders several things, or nothing, or loops.
 */
export function hostElement(model: ComponentModel | undefined, resolve: (declared: string) => ComponentModel | undefined, seen = new Set<string>()): string | undefined {
  if (!model || seen.has(model.declared)) return undefined;
  seen.add(model.declared);
  const returned = model.returns[0]?.value;
  const element = returned?.kind === "element" ? builtOnElement(returned.element) : undefined;
  if (!element) return undefined;
  if (element.type.kind === "host") return element.type.host.tag;
  return element.type.kind === "component" && element.type.declared ? hostElement(resolve(element.type.declared), resolve, seen) : undefined;
}
