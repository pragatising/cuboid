import type { DocNode } from "../core";

/** A block as the portfolio's old editor stored it. */
export type LegacyBlock = {
  id?: string;
  tag: string;
  variant?: string;
  props?: Record<string, string>;
  /** Inline source for text blocks; JSON for lists, columns and callouts; code for code blocks. */
  children: string;
};

export type MigrationIssueKind =
  /** There is no block for it yet: it is kept whole in a `legacy` block, and a later step will convert it. */
  | "unsupported"
  /** Something the new document has no place for was left out (a block's alignment). */
  | "dropped"
  /** Something was kept in the nearest form the new document has (a colour mapped to the closest palette colour). */
  | "approximated";

export type MigrationIssue = { blockId?: string; tag: string; kind: MigrationIssueKind; message: string };

export type Migrated = { doc: DocNode; issues: MigrationIssue[] };
