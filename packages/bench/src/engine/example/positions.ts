import type { ExampleTree } from "./readExample";

/** The line and column (both from 1, as the JSX transform in development counts them) of a place in a text. */
export function lineColumn(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let at = source.indexOf("\n"); at !== -1 && at < offset; at = source.indexOf("\n", at + 1)) {
    line += 1;
    lineStart = at + 1;
  }
  return { line, column: offset - lineStart + 1 };
}

/**
 * Where each instance is written in the example's file, as `"line:column"` of its opening `<`: the place the JSX transform reports for the element it makes, which is
 * how a page drawing the real, compiled example finds the one instance a change is for. `tree` is read from a part of the file (one example of it), so its
 * places are moved to where that part is.
 */
export function positionsOf(tree: ExampleTree, fileSource: string): Record<string, string> {
  const start = fileSource.indexOf(tree.source);
  if (start < 0) return {};
  return Object.fromEntries(
    tree.instances.map((instance) => {
      const { line, column } = lineColumn(fileSource, start + instance.range.from);
      return [instance.id, `${line}:${column}`];
    }),
  );
}
