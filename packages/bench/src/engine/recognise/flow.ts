import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import type { HookCall } from "../Interfaces/ComponentModel/HookCall";
import type { TreeElement } from "../Interfaces/ComponentModel/TreeElement";
import type { Models } from "./recognise";

/** Which names are made from which: a name a local or a hook binds comes from the names its code reads. */
export function flowEdges(model: ComponentModel, models: Models = {}): Map<string, Set<string>> {
  const derived = new Map<string, Set<string>>();
  const derive = (names: string[], from: string[]) => {
    for (const source of from) {
      if (!derived.has(source)) derived.set(source, new Set());
      for (const name of names) derived.get(source)?.add(name);
    }
  };
  for (const local of model.locals) derive(local.names, local.reads.map((r) => r.name));
  for (const hook of model.hooks) {
    // A hook this project wrote can be read: each name it returns comes from some of its arguments, not all of them.
    const precise = preciseHook(hook, models);
    if (precise) for (const [bound, from] of precise) derive([bound], from);
    else derive(hook.binds, hook.arguments.flatMap((a) => a.reads.map((r) => r.name)));
  }
  return derived;
}

/** Everything a set of names is made from, by following the edges back. */
function behind(names: string[], edges: Map<string, Set<string>>): Set<string> {
  const sources = new Map<string, Set<string>>();
  for (const [source, targets] of edges) for (const target of targets) sources.set(target, (sources.get(target) ?? new Set()).add(source));
  const seen = new Set(names);
  for (const next of seen) for (const source of sources.get(next) ?? []) seen.add(source);
  return seen;
}

/**
 * For a hook called as `const { a, b } = useX({ p, q })` where `useX` is written in this project and returns `{ a, b }`: which of the
 * call's names each bound name comes from. Null when it cannot be told (the hook is not read, takes its arguments differently, or
 * returns something other than an object), and the caller falls back to every argument.
 */
function preciseHook(hook: HookCall, models: Models): Map<string, string[]> | null {
  const inner = hook.declared ? models[hook.declared] : undefined;
  const options = hook.arguments[0];
  const parameter = inner?.params[0];
  if (!inner || !options || !parameter?.bindings.length || !hook.binds.length || !options.properties.length) return null;

  const given = new Map(options.properties.map((property) => [property.key, property.reads.map((r) => r.name)]));
  const returned = new Map<string, string[]>();
  for (const { value } of inner.returns) if (value.kind === "expression") for (const property of value.expr.properties) returned.set(property.key, property.reads.map((r) => r.name));
  const edges = flowEdges(inner, models);

  const result = new Map<string, string[]>();
  for (const bound of hook.binds) {
    const reads = returned.get(bound);
    if (!reads) return null;
    const made = behind(reads, edges);
    const keys = parameter.bindings.filter((b) => made.has(b.name)).map((b) => b.key ?? b.name);
    result.set(bound, keys.flatMap((key) => given.get(key) ?? []));
  }
  return result;
}

/**
 * The names that stand for the caller's props as a whole: a parameter taken whole (`props`), the `...rest` of a pattern, and what is
 * made from either (`const { rest } = split(allProps)`). Spreading a named prop (`{...wrapperProps}`) hands on only that one.
 */
export function wholeProps(model: ComponentModel): Set<string> {
  const edges = flowEdges(model);
  const whole = new Set(model.params.flatMap((param) => (param.bindings.length ? param.bindings.filter((b) => b.rest).map((b) => b.name) : [param.pattern])));
  const stack = [...whole];
  for (let next = stack.pop(); next !== undefined; next = stack.pop())
    for (const name of edges.get(next) ?? [])
      if (!whole.has(name)) {
        whole.add(name);
        stack.push(name);
      }
  return whole;
}

/** Whether an element gets the caller's props as a whole, so what the caller passes (`children`, `disabled`) lands on it. */
export const spreadsProps = (element: TreeElement, model: ComponentModel) => {
  const whole = wholeProps(model);
  return element.attributes.some((a) => a.kind === "spread" && a.value.reads.some((r) => whole.has(r.name) && ["param", "local", "hook"].includes(r.origin.kind)));
};

