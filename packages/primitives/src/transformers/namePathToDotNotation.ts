import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { upperCaseFirstCharacter } from "../utilities/upperCaseFirstCharacter.ts";

/**
 * camelCase implementation scoped to this transformer only — replaces
 * space/dash/underscore/plus separators. Matches Primer's internal helper
 * inside transformers/namePathToDotNotation.ts.
 */
function camelCase(input: string): string {
  return input
    .split(/[\s\-_+]+/g)
    .map((part, index) => (index === 0 ? part : upperCaseFirstCharacter(part)))
    .join("");
}

/**
 * Style Dictionary name transform: a token's `.path` array -> a
 * dot.notation string. Matches Primer's transformers/namePathToDotNotation.ts.
 * Used by invalidTokenError.ts to name a token in error messages.
 */
export const namePathToDotNotation: Transform = {
  name: "name/pathToDotNotation",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => {
    return [options?.prefix, ...token.path]
      .filter((part): part is string => typeof part === "string" && part !== "@")
      .map(camelCase)
      .join(".");
  },
};
