import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { formatDate, todayIso } from "../../utils/inline";
import { DateView } from "./DateView";
import { PillView } from "./PillView";

export const DateAtom = Node.create({
  name: "date",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => ({ iso: { default: todayIso() } }),
  parseHTML: () => [{ tag: "span[data-date]", getAttrs: (el) => ({ iso: (el as HTMLElement).dataset.date }) }],
  renderHTML: ({ node, HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-date": node.attrs.iso }), formatDate(String(node.attrs.iso))],
  addNodeView: () => ReactNodeViewRenderer(DateView, { as: "span" }),
});

export const PillAtom = Node.create({
  name: "pill",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => ({ label: { default: "Label" }, shade: { default: "gray" }, intensity: { default: "light" }, bordered: { default: false } }),
  parseHTML: () => [{ tag: "span[data-pill]", getAttrs: (el) => ({ label: (el as HTMLElement).textContent ?? "" }) }],
  renderHTML: ({ node, HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-pill": "" }), String(node.attrs.label)],
  addNodeView: () => ReactNodeViewRenderer(PillView, { as: "span" }),
});
