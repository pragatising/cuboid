/**
 * Primer-equivalent filter: checks token.$type === "..." — used by
 * platforms/ to route tokens into different output files from one
 * resolved tree (e.g. themed vs. non-themed CSS).
 *
 * Not yet implemented — stub only.
 */
export function isDeprecated(_token: unknown): boolean {
  throw new Error("not implemented");
}
