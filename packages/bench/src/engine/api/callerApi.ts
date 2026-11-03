import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { BuiltOn } from "./builtOn";
import type { ComponentJson, PropInfo } from "./types";

/** A prop the caller can set on a component. */
export type CallerProp = {
  /** The prop as the types give it, with the default the component applies. */
  info: PropInfo;
  /** Set when it is a prop of what the component is built on, which it takes and passes on as the caller wrote it. */
  how?: "passed on";
};

/** What the component writes itself on what it is built on, which the caller cannot set: `name = value`, as the code writes it. */
export type CallerSet = { name: string; value: string };

/**
 * What a caller can configure on a component, as the code says it, in one answer. `props` is every member of its props type, flat, in the order the
 * checker lists them; where a prop is declared does not change that the caller writes it on this component. The view draws this; it does not work it out.
 */
export type ComponentApi = {
  /** The public id: `Menu`, `Menu.Item`. */
  id: string;
  props: CallerProp[];
  sets: CallerSet[];
  /** What it is built on, when it is built on one component. */
  builtOn?: { on: string; declared?: string };
  /** The host element it finally is (`nav`), when the code says. */
  element?: string;
  /** The attributes the platform and other packages add, counted: not listed. */
  native: { dom: number; css: number };
  /** The ids of its parts. */
  parts: string[];
};

/**
 * `facts`: what the library reader gave for the component. `model`: what is written in its function, for the defaults its parameters give. `built`: what it writes on
 * the component it is built on. `element`: the host element it finally is. `resolveDefault`: the library's own adapter for a default written as a call or a lookup.
 */
export function callerApi({
  id,
  facts,
  model,
  built,
  element,
  resolveDefault,
}: {
  id: string;
  facts: Pick<ComponentJson, "props" | "native" | "parts">;
  model?: ComponentModel;
  built: BuiltOn | null;
  element?: string;
  resolveDefault?: (expression: string, prop: PropInfo) => string | undefined;
}): ComponentApi {
  const written = new Map((built?.settings ?? []).map((setting) => [setting.name, setting]));
  const bindings = new Map((model?.params[0]?.bindings ?? []).filter((binding) => !binding.rest).map((binding) => [binding.key ?? binding.name, binding]));
  const own = new Set(facts.props.map((prop) => prop.name));
  const props: CallerProp[] = [];
  // The props the component's own file declares come first; the ones its type takes from elsewhere follow, each group in the order the checker lists them.
  const file = model?.declared.split("#")[0];
  const ordered = file ? [...facts.props.filter((prop) => prop.source === file), ...facts.props.filter((prop) => prop.source !== file)] : facts.props;
  for (const prop of ordered) {
    const setting = written.get(prop.name);
    // What it writes after `{...props}` is the component's, whatever the caller says: it is not the caller's to set.
    if (setting?.how === "fixed") continue;
    // What it writes before the spread is applied until the caller sets it; else the default its docs or its parameter give.
    const applied = setting?.how === "default" ? (resolveDefault?.(setting.value, prop) ?? setting.value) : (prop.default ?? bindings.get(prop.name)?.default);
    props.push({ info: applied === undefined ? prop : { ...prop, default: applied }, ...(setting?.how === "wrapped" ? { how: "passed on" as const } : {}) });
  }
  // What it writes on what it is built on that is not one of its own props, or that it decides: `name = value`.
  const sets = (built?.settings ?? []).filter((setting) => setting.how === "fixed" || !own.has(setting.name)).map(({ name, value }) => ({ name, value }));
  return {
    id,
    props,
    sets,
    builtOn: built ? { on: built.on, declared: built.declared } : undefined,
    element,
    native: { dom: facts.native?.dom ?? 0, css: facts.native?.css ?? 0 },
    parts: (facts.parts ?? []).map((part) => (part as { name: string }).name),
  };
}
