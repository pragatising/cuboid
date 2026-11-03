import type { Node as ProseNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
import type { AnyBlock } from "../../core";
import { defaultBlocks } from "../../blocks";
import { ATOM_TYPES, LAYOUT_TYPES, TEXT_TYPES } from "./builtin";
import { BLOCK_TYPE_GROUP_LABELS } from "./constants";
import type { BlockType, BlockTypeGroup } from "./types";

/** After inserting a block, puts the cursor at the start of its first text, which is where the person goes on typing. */
function cursorIntoInserted(tr: Transaction, name: string) {
  const { $from } = tr.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === name) {
      tr.setSelection(TextSelection.near(tr.doc.resolve($from.start(depth)), 1));
      break;
    }
  }
  return true;
}

/**
 * What a block adds to the menus, from what it declares (`menu`) and what it holds: a block of text or of blocks is turned into in place
 * (a code block, a callout), one that holds nothing is inserted (an image, a divider). The block says how it is listed; the engine knows what choosing it does.
 */
function typeOfBlock(def: AnyBlock): BlockType | null {
  if (!def.menu) return null;
  // A block that says what to insert is inserted whole, and the cursor goes into it.
  if (def.insert) return { value: def.name, ...def.menu, convert: false, is: (node) => node.type.name === def.name, apply: (c) => c.insertContent(def.insert!).command(({ tr }) => cursorIntoInserted(tr, def.name)) };
  const apply = ({ inline: (c) => c.setNode(def.name), text: (c) => c.setNode(def.name), blocks: (c) => c.wrapIn(def.name), nothing: (c) => c.insertContent({ type: def.name }) } satisfies Record<AnyBlock["holds"], BlockType["apply"]>)[def.holds];
  return { value: def.name, ...def.menu, convert: def.holds !== "nothing", is: (node) => node.type.name === def.name, apply };
}

/** The types for a set of blocks: the engine's text types, the blocks' own, then the column layouts and the inline atoms. */
export const blockTypesFor = (blocks: AnyBlock[]): BlockType[] => [...TEXT_TYPES, ...blocks.flatMap((def) => typeOfBlock(def) ?? []), ...LAYOUT_TYPES, ...ATOM_TYPES];

export const BLOCK_TYPES: BlockType[] = blockTypesFor(Object.values(defaultBlocks));

/** The value of the type a node is now, or an empty string when it is none of them. */
export const typeOf = (node: ProseNode | null | undefined, types: BlockType[] = BLOCK_TYPES): string => (node ? (types.find((t) => t.is?.(node))?.value ?? "") : "");

/** The types a query names: its words are in the label or a keyword. An empty query names all of them. */
export function matchBlockTypes(query: string, types: BlockType[] = BLOCK_TYPES): BlockType[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return types;
  return types.filter((t) => {
    const haystack = [t.label, ...(t.keywords ?? [])].join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

/** The types as the groups `EditorBlockMenu` lists. `convertOnly` leaves out what can only be inserted. */
export function blockTypeGroups(types: BlockType[] = BLOCK_TYPES, convertOnly = false) {
  return (Object.keys(BLOCK_TYPE_GROUP_LABELS) as BlockTypeGroup[])
    .map((group) => ({
      label: BLOCK_TYPE_GROUP_LABELS[group],
      options: types.filter((t) => t.group === group && (!convertOnly || t.convert)).map((t) => ({ value: t.value, label: t.label })),
    }))
    .filter((group) => group.options.length > 0);
}
