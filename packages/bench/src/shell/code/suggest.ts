import { javascript } from "@codemirror/lang-javascript";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import type { Env } from "../../engine/content/check";
import type { Suggest } from "./ghostText";
import { attributesOf, openTagAt, tagName } from "./jsx";
import { propsOf } from "./completions";

/**
 * A suggester that needs no model of language: in an opening tag, it proposes the next prop the component requires and the element does
 * not have yet, with the value its model implies (the default, or the first of an enum). It is here to show the seam works end to end;
 * a language model would be a different function with the same shape.
 */
export function suggestRequiredProp(env: Env): Suggest {
  return async ({ doc, pos }) => {
    const state = EditorState.create({ doc, extensions: [javascript({ jsx: true, typescript: true })] });
    ensureSyntaxTree(state, doc.length, 200);
    const open = openTagAt(state, pos, true);
    if (!open || open.inValue) return null;
    const written = new Set(attributesOf(state, open.tag));
    const next = propsOf(env, tagName(state, open.tag)).find((p) => p.required && !written.has(p.name) && p.name !== "children");
    if (!next) return null;
    const value = next.kind === "flag" ? "" : next.kind === "enum" ? `="${next.default?.replace(/"/g, "") || next.values[0]}"` : next.kind === "open" ? '=""' : "={}";
    const space = /\s$/.test(doc.slice(0, pos)) ? "" : " ";
    return `${space}${next.name}${value}`;
  };
}
