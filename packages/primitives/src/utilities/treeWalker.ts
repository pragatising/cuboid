/**
 * Generic recursive walk over a plain-object tree, visiting every node that
 * satisfies `isValidItem` with `callback` and NOT recursing into that node's
 * own children (a token leaf like `{$value, $type}` is itself a plain
 * object — recursing into it would walk `$value`/`$type` as if they were
 * more nested groups). Matches Primer's utilities/treeWalker.ts exactly.
 *
 * Replaces build-theme.mjs's bespoke walkTokenFiles/walkJsonFiles/
 * resolveOnce/unwrap/convertPxToRemDeep functions — one generic walker
 * instead of five ad hoc ones, each of which only worked on one specific
 * shape. See DESIGN.md §2.
 */
export function treeWalker(
  tree: unknown,
  callback: (item: unknown) => unknown,
  isValidItem: (item: unknown) => boolean,
): unknown {
  if (isValidItem(tree)) {
    return callback(tree);
  }

  if (typeof tree !== "object" || tree === null) {
    return tree;
  }

  const next: Record<string, unknown> = {};
  for (const [prop, value] of Object.entries(tree)) {
    next[prop] = treeWalker(value, callback, isValidItem);
  }
  return next;
}
