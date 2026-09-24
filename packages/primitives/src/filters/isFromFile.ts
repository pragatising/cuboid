import type { TransformedToken } from "style-dictionary/types";

/**
 * True if a token originated from one of the given source file paths —
 * lets a platform build one output from a subset of source files.
 * Matches Primer's filters/isFromFile.ts.
 */
export function isFromFile(token: TransformedToken, files: string[]): boolean {
  return files?.includes(token.filePath) === true;
}
