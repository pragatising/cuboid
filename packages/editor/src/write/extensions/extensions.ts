import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import type { AnyBlock } from "../../core";
import { defaultBlocks } from "../../blocks";
import { compile } from "../compile";
import { Column, Columns } from "../columns";
import { DateAtom, PillAtom } from "../inline";
import { BlockExits } from "../exits";
import { OutlineItem } from "../outline";
import { Chip, HighlightMark, TextColor } from "../marks";
import { TableCell, TableEditing, TableHeader, TableRoles, TableRow } from "../table";
import { PasteLink } from "./pasteLink";
import { DocumentFlow } from "./documentFlow";
import { placeholderFor } from "./placeholder";

/** The engine nodes for a set of blocks, plus the text and layout nodes every document has. */
export const extensionsFor = (blocks: AnyBlock[] = Object.values(defaultBlocks)) => [
  // Code is a block of ours (a Read and a Write face), not the engine's.
  StarterKit.configure({ codeBlock: false }),
  Underline,
  DocumentFlow,
  BlockExits,
  PasteLink,
  // A link is opened by the reader, not by a click while editing; the address is checked where it is set (`safeHref`).
  Link.configure({ openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
  Placeholder.configure({ showOnlyCurrent: true, includeChildren: true, placeholder: placeholderFor }),
  TextColor,
  HighlightMark,
  Chip,
  ...blocks.map(compile),
  // An outline's items only exist where the outline does: their content names it.
  ...(blocks.some((def) => def.name === "outlineTree") ? [OutlineItem] : []),
  // A table's rows and cells only exist where the table does, and the plugin that edits them needs nothing else.
  ...(blocks.some((def) => def.name === "table") ? [TableRoles, TableRow, TableCell, TableHeader, TableEditing] : []),
  DateAtom,
  PillAtom,
  Column,
  Columns,
];
