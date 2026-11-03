import type { ChainedCommands } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { BlockType } from "./types";

// What the engine itself provides, apart from the blocks a document is given: text and its lists, the column layouts, the inline atoms.

const heading = (level: 1 | 2 | 3 | 4 | 5 | 6): BlockType => ({
  value: `h${level}`,
  label: `Heading ${level}`,
  group: "basic",
  keywords: [`h${level}`, "title"],
  convert: true,
  is: (node) => node.type.name === "heading" && node.attrs.level === level,
  apply: (chain) => chain.setHeading({ level }),
});

const columns = (count: number): BlockType => ({
  value: `columns-${count}`,
  label: `${count} columns`,
  group: "layout",
  keywords: ["column", "layout"],
  convert: false,
  apply: (chain) =>
    chain.insertContent({ type: "columns", content: Array.from({ length: count }, () => ({ type: "column", content: [{ type: "paragraph" }] })) }),
});

/** Inserts an inline atom and selects it, which opens its editor: a new date or pill is set where it stands, not afterwards. */
const insertAtom = (name: string) => (chain: ChainedCommands) =>
  chain.insertContent({ type: name }).command(({ tr }) => {
    const at = tr.selection.from - 1;
    if (tr.doc.nodeAt(at)?.type.name === name) tr.setSelection(NodeSelection.create(tr.doc, at));
    return true;
  });

export const TEXT_TYPES: BlockType[] = [
  { value: "paragraph", label: "Paragraph", group: "basic", keywords: ["text", "plain"], convert: true, is: (n) => n.type.name === "paragraph", apply: (c) => c.setParagraph() },
  heading(1),
  heading(2),
  heading(3),
  heading(4),
  heading(5),
  heading(6),
  { value: "bulletList", label: "Bullet list", group: "basic", keywords: ["ul", "unordered"], convert: true, is: (n) => n.type.name === "bulletList", apply: (c) => c.toggleBulletList() },
  { value: "orderedList", label: "Numbered list", group: "basic", keywords: ["ol", "ordered"], convert: true, is: (n) => n.type.name === "orderedList", apply: (c) => c.toggleOrderedList() },
  { value: "blockquote", label: "Quote", group: "basic", keywords: ["blockquote"], convert: true, is: (n) => n.type.name === "blockquote", apply: (c) => c.toggleBlockquote() },
];

export const LAYOUT_TYPES: BlockType[] = [columns(2), columns(3)];

export const ATOM_TYPES: BlockType[] = [
  { value: "date", label: "Date", group: "inline", keywords: ["today", "mention"], convert: false, apply: insertAtom("date") },
  { value: "pill", label: "Pill", group: "inline", keywords: ["tag", "chip", "label", "badge"], convert: false, apply: insertAtom("pill") },
];
