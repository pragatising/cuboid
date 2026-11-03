import type { ReadRegistry } from "../core";
import { calloutRead } from "./callout/read";
import { codeBlockRead } from "./codeBlock/read";
import { dividerRead } from "./divider/read";
import { imageRead } from "./image/read";
import { legacyRead } from "./legacy/read";
import { outlineTreeRead } from "./outlineTree/read";
import { smartLinkRead } from "./smartLink/read";
import { tableRead } from "./table/read";

export { calloutRead } from "./callout/read";
export { codeBlockRead, CODE_LANGUAGES } from "./codeBlock/read";
export { dividerRead } from "./divider/read";
export { imageRead } from "./image/read";
export { legacyRead } from "./legacy/read";
export { outlineTreeRead } from "./outlineTree/read";
export { smartLinkRead } from "./smartLink/read";
export { tableRead } from "./table/read";

/** The read faces of the blocks every document can use, by the name the document gives them. Imports nothing from the editing engine. */
export const readBlocks: ReadRegistry = { callout: calloutRead, codeBlock: codeBlockRead, divider: dividerRead, image: imageRead, outlineTree: outlineTreeRead, smartLink: smartLinkRead, table: tableRead, legacy: legacyRead };
