import { format } from "prettier";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";

/**
 * Resolved token tree -> a flat `{"--token-name": value}` map, for a
 * PostCSS custom-property fallback plugin during a token migration
 * period. Matches Primer's formats/jsonPostCssFallback.ts. No current
 * deprecated-token workflow uses this yet — real infrastructure.
 */
export const jsonPostCssFallback: FormatFn = ({ dictionary, file: _file }: FormatFnArguments) => {
  const tokens = Object.fromEntries(dictionary.allTokens.map((token) => [`--${token.name}`, token.$value]));
  const output = JSON.stringify(tokens, null, 2);
  return format(output, { parser: "json", printWidth: 500 });
};
