import { CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult, CompletionSource } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";

export { env } from "./env";

/** A document with the cursor marked by `|`, parsed as the editor parses it (JSX and TypeScript). */
export function stateAt(marked: string) {
  const pos = marked.indexOf("|");
  const doc = marked.replace("|", "");
  const state = EditorState.create({ doc, selection: { anchor: pos }, extensions: [javascript({ jsx: true, typescript: true })] });
  ensureSyntaxTree(state, doc.length, 5000);
  return { state, pos, doc };
}

export async function complete(source: CompletionSource, marked: string, explicit = false): Promise<CompletionResult | null> {
  const { state, pos } = stateAt(marked);
  return (await source(new CompletionContext(state, pos, explicit))) as CompletionResult | null;
}

export const labels = (result: CompletionResult | null) => (result?.options ?? []).map((o) => o.label);

/** jsdom has no layout; the editor measures text with ranges, so every range is empty. */
export function installDomPolyfills() {
  const rects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getClientRects ??= rects;
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
  (Text.prototype as unknown as { getClientRects?: () => DOMRectList }).getClientRects ??= rects;
  document.elementFromPoint ??= () => null;
}
