import { Fragment, jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import type { Value } from "../../engine/types";
import { patchAt } from "./patches";
import { materialize } from "./materialize";

export { Fragment };

/** Where the transform says an element is written. */
type Source = { fileName?: string; lineNumber?: number; columnNumber?: number };

/**
 * The JSX runtime the examples are compiled against (see `benchJsx` in plugin.ts): React's own, except that an element written at a place the pane has changed
 * is made with those props over the ones it was written with. Only an example is compiled this way: the library's own elements go through React's runtime and are
 * never touched. An element is found by where it is written, so of three written alike only the one that was changed changes.
 */
export function jsxDEV(type: unknown, props: Record<string, unknown>, key: unknown, isStatic: boolean, source?: Source, self?: unknown) {
  const patch = source?.lineNumber !== undefined && source.columnNumber !== undefined ? patchAt(source.lineNumber, source.columnNumber) : undefined;
  if (!patch) return reactJsxDEV(type as never, props, key as never, isStatic, source as never, self);
  const patched: Record<string, unknown> = { ...props };
  for (const [name, value] of Object.entries(patch as Record<string, Value | undefined>)) {
    if (value === undefined) delete patched[name];
    else patched[name] = materialize(value);
  }
  return reactJsxDEV(type as never, patched, key as never, isStatic, source as never, self);
}
