import { format } from "prettier";
import { jsonToFlat } from "./utilities/jsonToFlat";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";
import { sortByName } from "style-dictionary/utils";

/**
 * Resolved token tree -> a flat one-dimensional JSON object (dot-path
 * name -> value, or the full token object if `outputVerbose`). Matches
 * Primer's formats/jsonOneDimensional.ts — used for docs/tooling
 * consumers that want full provenance, NOT the shape `defaultTheme.ts`
 * imports (see jsonNestedPrefixed.ts for that).
 */
export const jsonOneDimensional: FormatFn = ({ dictionary, file: _file, options }: FormatFnArguments) => {
  const { outputVerbose, propertyConversion } = options;
  const tokens = jsonToFlat(dictionary.allTokens.sort(sortByName), outputVerbose);

  if (propertyConversion === undefined) {
    const output = JSON.stringify(tokens, null, 2);
    return format(output, { parser: "json", printWidth: 500 });
  }

  const convertedTokens = Object.fromEntries(
    Object.entries(tokens).map(([name, token]) => {
      const tokenRecord = token as Record<string, unknown>;
      for (const [from, to] of Object.entries(propertyConversion as Record<string, string>)) {
        if (from in tokenRecord) {
          tokenRecord[to] = tokenRecord[from];
          delete tokenRecord[from];
        }
      }
      return [name, tokenRecord];
    }),
  );

  const output = JSON.stringify(convertedTokens, null, 2);
  return format(output, { parser: "json", printWidth: 500 });
};
