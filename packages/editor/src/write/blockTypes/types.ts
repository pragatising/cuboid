import type { ChainedCommands } from "@tiptap/core";
import type { Node as ProseNode } from "@tiptap/pm/model";
import type { MenuGroup } from "../../core";

export type BlockTypeGroup = MenuGroup;

/**
 * One thing the `/` menu can put in the page, and one thing a block can be turned into. One list serves both, so the two menus
 * cannot disagree about what a block can be.
 */
export type BlockType = {
  value: string;
  label: string;
  group: BlockTypeGroup;
  /** Extra words the `/` menu matches besides the label. */
  keywords?: string[];
  /** Whether a block of this type can be turned into it in place (the `+` menu lists only these). The rest are inserted. */
  convert: boolean;
  /** Whether a node is already this type, for the check mark. */
  is?: (node: ProseNode) => boolean;
  /**
   * Applies it where the chain's selection is, or inserts it there. Takes and returns the chain, so a caller can put it in the
   * same undoable step as what came before (the `/query` being deleted).
   */
  apply: (chain: ChainedCommands) => ChainedCommands;
};
