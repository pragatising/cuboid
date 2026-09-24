import { format } from "prettier";
import { prefixTokens } from "./utilities/prefixTokens";
import { jsonToNestedValue } from "./utilities/jsonToNestedValue";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";

/**
 * Resolved token tree -> one nested JSON file, adding a top-level prefix
 * key if the platform declares one. This is the shared JSON output
 * format used both by cuboid's own build (what `defaultTheme.ts`
 * imports) and by an app compiling its own theme (DESIGN.md §4/Task
 * 4.5) — one code path, so both resolve tokens identically. Matches
 * Primer's formats/jsonNestedPrefixed.ts.
 */
export const jsonNestedPrefixed: FormatFn = async ({ dictionary, file: _file, options, platform }: FormatFnArguments) => {
  const { outputVerbose } = options;
  let tokens = prefixTokens(dictionary.tokens, platform);

  if (!outputVerbose) {
    tokens = jsonToNestedValue(tokens) as typeof tokens;
  }

  const output = JSON.stringify(tokens, null, 2);
  return await format(output, { parser: "json", printWidth: 500 });
};
