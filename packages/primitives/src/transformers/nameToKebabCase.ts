import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Style Dictionary name transform: a token's `.path` array -> one
 * kebab-case CSS custom property name (e.g. ["button", "bgColor"] ->
 * "button-bgColor" — inner camelCase is preserved, not split further;
 * matches Primer's real namePathToKebabCase.ts). The "cube" prefix comes
 * from Style Dictionary's own `prefix` platform option, not hardcoded
 * here — set it once in the platform config, not per-transform.
 */
export const nameToKebabCase: Transform = {
  name: "name/pathToKebabCase",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => {
    return [options?.prefix, ...token.path]
      .filter((part): part is string => typeof part === "string" && part !== "@")
      .join("-");
  },
};
