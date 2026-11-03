// The write entry. The only place the editing engine (Tiptap / ProseMirror) is imported.
import { Node } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { AnyBlock, ElementSpec } from "../../core";
import { isControlEvent } from "./controls";

/** A block definition as an engine node: its data shape is the node's attrs, and its Write face is the node's view. */
export function compile(def: AnyBlock) {
  return Node.create({
    name: def.name,
    // The definition travels with the node, so whatever draws around it (the gutter) can read what the block brings (its settings).
    addOptions: () => ({ def }),
    group: ["block", ...(def.groups ?? ["columnBlock", "calloutBlock"])].join(" "),
    content: { inline: "inline*", text: "text*", blocks: def.accepts ?? "block+", nothing: undefined }[def.holds],
    // Plain text is code: no marks, newlines are kept, and Enter inserts one instead of splitting the block.
    ...(def.holds === "text" ? { code: true, marks: "", defining: true } : {}),
    atom: def.holds === "nothing",
    ...def.spec,
    addAttributes: () => def.attrs,
    parseHTML: () => [{ tag: `[data-block="${def.name}"]` }],
    renderHTML: ({ HTMLAttributes }) => ["div", { ...HTMLAttributes, "data-block": def.name }, 0],
    addNodeView() {
      const { element, Write } = def;
      if (element) {
        // The element is the node's view and its content, so its children are the node's children, with nothing between (an `ol` holds `li`s).
        // Any elements it sits in come first, and the first of all is the node's own.
        return () => {
          const make = ({ tag, attributes }: ElementSpec) => {
            const el = document.createElement(tag);
            for (const [name, value] of Object.entries(attributes ?? {})) el.setAttribute(name, value);
            return el;
          };
          const chain = [...(element.around ?? []), element].map(make);
          chain.forEach((el, i) => chain[i - 1]?.append(el));
          chain[0].dataset.block = def.name;
          return { dom: chain[0], contentDOM: chain[chain.length - 1] };
        };
      }
      if (!Write) throw new Error(`The block "${def.name}" has neither a Write face nor an element.`);
      return ReactNodeViewRenderer(
        ({ node, updateAttributes, selected }) => (
          <NodeViewWrapper>
            <Write attrs={node.attrs} update={updateAttributes} selected={selected}>
              {def.holds === "nothing" ? undefined : <NodeViewContent {...(def.holds === "blocks" ? { "data-prose-flow": "" } : {})} />}
            </Write>
          </NodeViewWrapper>
        ),
        // A block that holds nothing is an atom with controls of its own (an image's upload bar and toolbar): using one must not select the block.
        def.holds === "nothing" ? { stopEvent: isControlEvent } : undefined,
      );
    },
  });
}
