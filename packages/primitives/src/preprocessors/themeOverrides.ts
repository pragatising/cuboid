import type { PlatformConfig, PreprocessedTokens, Preprocessor } from "style-dictionary/types";
import { transformTokens } from "./utilities/transformTokens";
import { asArray } from "../utilities/asArray";

/**
 * The real dark-mode/theme-variant mechanism (DESIGN.md §5): collapses a
 * token's inline `$extensions['org.cuboid.overrides']` object down to
 * one resolved value per theme at build time, with two-level fallback
 * ([currentTheme, fallbackTheme]). An override entry can be a bare
 * value/reference or a partial token object. Matches Primer's
 * preprocessors/themeOverrides.ts (renamed `org.primer.overrides`).
 * Not yet wired into any real build — no theme data authored yet.
 */
export const themeOverrides: Preprocessor = {
  name: "themeOverrides",
  preprocessor: (dictionary: PreprocessedTokens, config: PlatformConfig): PreprocessedTokens => {
    const extensionProp = config.options?.themeOverrides?.extensionProp || "org.cuboid.overrides";
    const valueProp = config.options?.themeOverrides?.valueProp || "$value";
    const [currentTheme, fallbackTheme] = asArray(config.options?.themeOverrides?.theme);

    return transformTokens(dictionary, (token) => {
      if (!currentTheme || !token.$extensions?.[extensionProp] || (!token.$extensions?.[extensionProp][currentTheme] && !token.$extensions?.[extensionProp][fallbackTheme])) {
        return token;
      }

      const override = token.$extensions?.[extensionProp][currentTheme] || token.$extensions?.[extensionProp][fallbackTheme];

      return {
        ...token,
        ...(typeof override === "object" ? override : { [valueProp]: override }),
      };
    }) as unknown as PreprocessedTokens;
  },
};
