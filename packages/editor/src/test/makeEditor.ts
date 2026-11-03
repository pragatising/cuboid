import { Editor } from "@tiptap/core";
import type { AnyExtension } from "@tiptap/core";
import type { DocNode } from "../core";
import { extensionsFor } from "../write/extensions";

const made: Editor[] = [];

// An editor left running keeps a DOM observer's timer alive past the end of the test.
afterEach(() => made.splice(0).forEach((editor) => editor.destroy()));

/** An editor on a detached element, destroyed when the test ends. */
export function makeEditor(content: DocNode, extensions: AnyExtension[] = extensionsFor()): Editor {
  const editor = new Editor({ element: document.createElement("div"), extensions, content });
  made.push(editor);
  return editor;
}
