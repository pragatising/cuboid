import { format } from "prettier";
import { jsonToNestedValue } from "./utilities/jsonToNestedValue";
import { prefixTokens } from "./utilities/prefixTokens";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";
import { fileHeader } from "style-dictionary/utils";

/**
 * Resolved token tree -> an ESM `export default {...}` file. Matches
 * Primer's formats/javascriptEsm.ts. Not the format `defaultTheme.ts`
 * actually uses (that's jsonNestedPrefixed.ts, per this session's
 * decision to share one JSON format between cuboid's build and app
 * theme compilation) — built as real infrastructure for a consumer that
 * specifically wants a real ESM module instead of a plain JSON import.
 */
export const javascriptEsm: FormatFn = async ({ dictionary, file, platform }: FormatFnArguments) => {
  const tokens = prefixTokens(dictionary.tokens, platform);
  const output = `${await fileHeader({ file })}export default \n${JSON.stringify(jsonToNestedValue(tokens), null, 2)}\n`;
  return format(output, { parser: "typescript", printWidth: 500 });
};
