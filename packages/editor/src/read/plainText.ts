import type { DocNode } from "../core";

/** A node's text, with line breaks as newlines. */
export const plainText = (node: DocNode): string => (node.type === "hardBreak" ? "\n" : (node.text ?? (node.content ?? []).map(plainText).join("")));
