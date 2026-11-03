import type { ComponentType, ReactNode, RefObject } from "react";
import type { IconProps } from "@sragatiping/cuboid";

import type { DocNode } from "./doc";

export type BlockAttrs = Record<string, unknown>;

/** One plain element: its tag and attributes. */
export type ElementSpec = { tag: string; attributes?: Record<string, string> };

export type ReadProps<A extends BlockAttrs> = {
  attrs: A;
  /** The block's content, already rendered: inline text for a text block, child blocks for a container. */
  children: ReactNode;
  /** The block's content as plain text, for a block that draws it itself (code). Line breaks are newlines. */
  text: string;
};

export type WriteProps<A extends BlockAttrs> = {
  attrs: A;
  update: (next: Partial<A>) => void;
  /** The block is selected as a whole (its gutter handle was clicked). */
  selected: boolean;
  /** Where the editable content goes. Absent for blocks that hold nothing of their own. */
  children?: ReactNode;
};

/** The face a reader sees: the shape of the block's data and how it is drawn. It lives in its own module, so the read entry never reaches the engine. */
export type ReadBlock<A extends BlockAttrs = BlockAttrs> = {
  name: string;
  attrs: { [K in keyof A]: { default: A[K] } };
  Read: ComponentType<ReadProps<A>>;
};

/** What a block's settings panel is given: the block's attributes, a way to change them, and the element the panel hangs from. */
export type SettingsProps<A extends BlockAttrs> = {
  attrs: A;
  update: (next: Partial<A>) => void;
  anchor: RefObject<HTMLElement | null>;
  /** The panel asks to be closed (an outside click, Escape). */
  onClose: () => void;
};

/** A panel the block brings for its own attributes. The gutter lists it in the block's menu and draws it, knowing nothing of the block. */
export type BlockSettings<A extends BlockAttrs = BlockAttrs> = {
  /** The menu item that opens it. */
  label: string;
  /** The Cuboid icon beside the label. */
  icon: IconProps["name"];
  Panel: ComponentType<SettingsProps<A>>;
};

/** Where a block is listed in the `/` and turn-into menus. */
export type MenuGroup = "basic" | "media" | "layout" | "inline";

/** How a block is offered in the menus. The engine derives what choosing it does from what the block holds. Absent: the menus do not list it. */
export type BlockMenuEntry = {
  label: string;
  group: MenuGroup;
  /** Extra words the `/` menu matches besides the label. */
  keywords?: string[];
};

/** The face a writer sees: what the block holds, and how it is drawn inside the editor. */
export type WriteBlock<A extends BlockAttrs = BlockAttrs> = {
  /** What it holds: inline text, plain text only (no marks, as code), other blocks, or nothing (an atom). */
  holds: "inline" | "text" | "blocks" | "nothing";
  /** For a block that holds blocks: which ones, as a content expression. Absent: any block. */
  accepts?: string;
  /**
   * Where this block may sit, besides the page: `columnBlock` (in a column) and `calloutBlock` (in a callout). Absent: both. Columns and
   * callouts leave themselves out, so neither nests in itself, by the schema and not by a menu that hides the option.
   */
  groups?: string[];
  /** How it is drawn inside the editor. Absent when the block is a plain `element`. */
  Write?: ComponentType<WriteProps<A>>;
  /**
   * The block as one plain element that holds its content, drawn by the engine with no component and no wrapper around it, for a block whose
   * content must be that element's direct children (a list: `ol > li`). Cuboid's own rules, keyed on `data-component`, draw it.
   */
  element?: ElementSpec & {
    /** Elements the content element sits in, outermost first (`div > table` around a `tbody`). The outermost is the block's own element, with nothing else between. */
    around?: ElementSpec[];
  };
  /**
   * What the block inserts when a menu picks it, for a block whose shape the menus cannot derive from what it holds (a table is a few rows of
   * cells, not a wrapped selection). The cursor goes to the start of what was inserted. Absent: derived from `holds`.
   */
  insert?: DocNode;
  /** Extra keys for the engine's schema spec, which a plugin of the engine reads (a table's role for the table plugin). Opaque to everything else. */
  spec?: Record<string, unknown>;
  /** A panel for the block's attributes, opened from its gutter menu. Absent: the block has none. */
  settings?: BlockSettings<A>;
  /** How the menus list the block. Absent: they do not. */
  menu?: BlockMenuEntry;
};

/** One block, both faces. `Read` never imports the editing engine, so a site that only shows content ships none of it. */
export type BlockDef<A extends BlockAttrs = BlockAttrs> = ReadBlock<A> & WriteBlock<A>;

/** A registry holds blocks of different attrs, so its element type cannot name them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyReadBlock = ReadBlock<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBlock = BlockDef<any>;
export type ReadRegistry = Record<string, AnyReadBlock>;
export type BlockRegistry = Record<string, AnyBlock>;

export const defineReadBlock = <A extends BlockAttrs>(def: ReadBlock<A>): ReadBlock<A> => def;
export const defineBlock = <A extends BlockAttrs>(read: ReadBlock<A>, write: WriteBlock<A>): BlockDef<A> => ({ ...read, ...write });
