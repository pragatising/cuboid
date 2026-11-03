import { snippetCompletion } from "@codemirror/autocomplete";
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from "@codemirror/autocomplete";
import { modelFor } from "../../engine/content/check";
import type { Env } from "../../engine/content/check";
import { propDoc } from "../../engine/recognise/recognise";
import type { PropDoc } from "../../engine/types";
import { attributesOf, elementAt, openTagAt, tagName } from "./jsx";

/** What a component takes, read from the model the extractor made of it: nothing here is written by hand. */
export type PropInfo = { name: string; type: string; doc?: string; default?: string; required: boolean; kind: PropDoc["kind"]; values: (string | number)[] };

/** Every component by the name a file writes it as: `Button`, and its parts (`Menu.Item`) when the model says what they are. */
export function componentNames(env: Env): string[] {
  const names: string[] = [];
  for (const root of Object.keys(env.exported)) {
    names.push(root);
    for (const part of env.models[env.exported[root]]?.statics ?? []) if (modelFor(`${root}.${part.name}`, env)) names.push(`${root}.${part.name}`);
  }
  return names;
}

export function propsOf(env: Env, tag: string): PropInfo[] {
  const model = modelFor(tag, env);
  if (!model) return [];
  return model.props.map((prop) => {
    const d = propDoc(prop);
    return { name: prop.name, type: prop.type, doc: prop.doc, default: prop.default, required: Boolean(prop.required), kind: d.kind, values: d.values ?? [] };
  });
}

const info = (p: PropInfo) => [p.doc, p.default !== undefined ? `default: ${p.default}` : null, p.required ? "required" : null].filter(Boolean).join("\n") || undefined;

/** How a prop is written: a flag by its name, text in quotes, anything else in braces, with the cursor where the value goes. */
export const template = (p: PropInfo) => (p.kind === "flag" ? p.name : p.kind === "enum" || p.kind === "open" ? `${p.name}="\${}"` : `${p.name}={\${}}`);

const shortType = (type: string) => (type.length > 28 ? `${type.slice(0, 27)}…` : type);

/**
 * Whether a `<` begins a tag. After a value (`b <`) it is a comparison; where an expression can start (after `(`, `=`, `return`, `>`…) it
 * is a tag, and so it is inside an element's children, where text and tags mix.
 */
function startsTag(context: CompletionContext, at: number): boolean {
  const before = context.state.sliceDoc(Math.max(0, at - 40), at).replace(/\s+$/, "");
  if (before === "" || /([(\[{,=:?&|!>;]|\breturn|\bdefault|=>)$/.test(before)) return true;
  const inside = elementAt(context.state, at - 1);
  return Boolean(inside && at > inside.openTo && at <= inside.to);
}

/**
 * Suggestions from the components themselves: the name after `<`, the props of the element you are in (the required ones first, those
 * already written left out), and the values of an enum prop inside its quotes.
 */
export function componentCompletions(env: Env): CompletionSource {
  const names = componentNames(env);
  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;

    const tag = context.matchBefore(/<[\w.]*$/);
    if (tag && startsTag(context, tag.from)) {
      return { from: tag.from + 1, validFor: /^[\w.]*$/, options: names.map((label): Completion => ({ label, type: "class", detail: "component", boost: label.includes(".") ? -1 : 0 })) };
    }

    const open = openTagAt(state, pos);
    if (!open) return null;
    const props = propsOf(env, tagName(state, open.tag));
    if (!props.length) return null;

    const value = context.matchBefore(/([A-Za-z_]\w*)=(["'])([^"']*)$/);
    if (value) {
      const [, attribute, , typed] = /^([A-Za-z_]\w*)=(["'])([^"']*)$/.exec(value.text) ?? [];
      const prop = props.find((p) => p.name === attribute);
      if (!prop || prop.kind !== "enum") return null;
      return { from: pos - typed.length, validFor: /^[\w.-]*$/, options: prop.values.map((v): Completion => ({ label: String(v), type: "enum", detail: prop.name, boost: String(v) === prop.default?.replace(/"/g, "") ? 1 : 0 })) };
    }

    if (open.inValue) return null;
    const word = context.matchBefore(/[\w-]*$/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const written = new Set(attributesOf(state, open.tag, open.attribute));
    return {
      from: word.from,
      validFor: /^[\w-]*$/,
      options: props
        .filter((p) => !written.has(p.name) && p.name !== "children")
        .map((p) => snippetCompletion(template(p), { label: p.name, type: "property", detail: p.required ? `${shortType(p.type)} · required` : shortType(p.type), info: info(p), boost: p.required ? 50 : 0 })),
    };
  };
}
