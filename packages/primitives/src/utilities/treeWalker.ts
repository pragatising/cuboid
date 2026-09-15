/**
 * Generic recursive walk over a plain-object tree, visiting every leaf with
 * its full path. This is what replaces build-theme.mjs's bespoke
 * walkTokenFiles/walkJsonFiles/resolveOnce/unwrap/convertPxToRemDeep
 * functions — one generic walker instead of five ad hoc ones, each of
 * which only worked on one specific shape. See DESIGN.md §2.
 *
 * Not yet implemented — stub only.
 */
export function treeWalker(): void {
  throw new Error("not implemented");
}
