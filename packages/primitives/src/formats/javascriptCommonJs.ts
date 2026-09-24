import { format } from "prettier";
import { jsonToNestedValue } from "./utilities/jsonToNestedValue";
import { prefixTokens } from "./utilities/prefixTokens";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";
import { fileHeader } from "style-dictionary/utils";

/**
 * Resolved token tree -> a CommonJS `module.exports = {...}` file.
 * Matches Primer's formats/javascriptCommonJs.ts. No current consumer —
 * packages/react's package.json is `"type": "module"` — built as real
 * infrastructure for a future non-ESM consumer.
 */
export const javascriptCommonJs: FormatFn = async ({ dictionary, file, platform }: FormatFnArguments) => {
  const tokens = prefixTokens(dictionary.tokens, platform);
  const output = `${await fileHeader({ file })}module.exports = ${JSON.stringify(jsonToNestedValue(tokens), null, 2)}\n`;
  return format(output, { parser: "typescript", printWidth: 500 });
};
