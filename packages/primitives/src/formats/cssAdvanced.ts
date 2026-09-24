import type { TransformedToken, FormatFn, FormatFnArguments, FormattingOptions } from "style-dictionary/types";
import { format } from "prettier";
import { fileHeader, formattedVariables, sortByName } from "style-dictionary/utils";

function wrapWithSelector(css: string, selector: string | false): string {
  if (selector === false || selector.trim().length === 0) return css;
  return `${selector} { ${css} }`;
}

/**
 * Resolved token tree -> one CSS file of `--cube-*` custom properties,
 * theme-selector-scoped, with optional per-token @media grouping via an
 * extension property. Matches Primer's formats/cssAdvanced.ts — the
 * first real output format cuboid's pipeline produces.
 */
export const cssAdvanced: FormatFn = async ({ dictionary: originalDictionary, options = { queries: [] }, file }: FormatFnArguments) => {
  const { outputReferences, usesDtcg, formatting } = options;
  const selector = file.options?.selector !== undefined ? file.options.selector : ":root";
  const queryExtProp = file.options?.queryExtensionProperty || "mediaQuery";
  const queries: Array<{ query?: string; selector?: string | false; matcher: (token: TransformedToken) => boolean }> = file.options?.queries || [
    { query: undefined, matcher: () => true },
  ];

  const mergedFormatting: FormattingOptions = {
    commentStyle: "long",
    ...formatting,
  };

  const dictionary = { ...originalDictionary };

  for (const designToken of dictionary.allTokens) {
    const query = designToken.$extensions?.[queryExtProp];
    if (!query) continue;

    const currentQueryIndex = queries.findIndex((q) => q.query === query);

    if (currentQueryIndex > -1) {
      const existing = queries[currentQueryIndex];
      queries[currentQueryIndex] = {
        ...existing,
        matcher: (token: TransformedToken) => existing.matcher(token) || token.$extensions?.[queryExtProp] === existing.query,
      };
    } else {
      queries.push({
        query,
        matcher: (token: TransformedToken) => token.$extensions?.[queryExtProp] === query,
      });
    }
  }

  const output = [await fileHeader({ file })];

  for (const query of queries) {
    const { query: queryString, matcher } = query;
    const filteredDictionary = {
      ...dictionary,
      allTokens: dictionary.allTokens.filter(matcher || (() => true)).sort(sortByName),
    };

    if (!filteredDictionary.allTokens.length) continue;

    const css = formattedVariables({
      format: "css",
      dictionary: filteredDictionary,
      outputReferences,
      formatting: mergedFormatting,
      usesDtcg,
    });

    const cssWithSelector = wrapWithSelector(css, query.selector !== undefined ? query.selector : selector);
    output.push(queryString ? `${queryString} { ${cssWithSelector} }` : cssWithSelector);
  }

  return await format(output.join("\n"), { parser: "css", printWidth: 500 });
};
