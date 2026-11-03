import type { BlockRegistry } from "../core";
import { callout } from "./callout";
import { codeBlock } from "./codeBlock";
import { divider } from "./divider";
import { image } from "./image";
import { legacy } from "./legacy";
import { outlineTree } from "./outlineTree";
import { smartLink } from "./smartLink";
import { table } from "./table";

export { callout, codeBlock, divider, image, legacy, outlineTree, smartLink, table };
export { ImageRemove, ImageUpload } from "./image";
export { CODE_LANGUAGES, readBlocks } from "./read";

/** The blocks every document can use, with both faces, by the name the document gives them. */
// The order is the menus' order within a group.
export const defaultBlocks: BlockRegistry = { codeBlock, callout, divider, image, smartLink, outlineTree, table, legacy };
