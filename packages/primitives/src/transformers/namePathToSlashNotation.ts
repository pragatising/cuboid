import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Token path segments -> a slash/notation string. Matches Primer's
 * transformers/namePathToSlashNotation.ts.
 */
export const namePathToSlashNotation: Transform = {
  name: "name/pathToSlashNotation",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => {
    return [options?.prefix, ...token.path].filter((part): part is string => typeof part === "string" && part !== "@").join("/");
  },
};
