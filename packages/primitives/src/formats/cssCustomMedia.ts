import { format } from "prettier";
import type { FormatFn, FormatFnArguments } from "style-dictionary/types";
import { fileHeader, sortByName } from "style-dictionary/utils";

/**
 * Resolved viewport-range tokens -> `@custom-media` CSS rules. Matches
 * Primer's formats/cssCustomMedia.ts. No confirmed cuboid use yet
 * (no viewportRange tokens authored) — real infrastructure, ready the
 * moment one exists.
 */
export const cssCustomMedia: FormatFn = async ({ dictionary, options: _options, file }: FormatFnArguments) => {
  const output = [await fileHeader({ file })];

  dictionary.allTokens.sort(sortByName).forEach(({ name, $value }) => {
    output.push(`@custom-media --${name} ${$value};`);
  });

  return format(output.join("\n"), { parser: "css", printWidth: 500 });
};
