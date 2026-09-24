import { toCamelCase } from "../utilities/toCamelCase.ts";
import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Token path segments -> one camelCase key. Used for the JSON output's
 * key naming (Task 4's defaultTheme.ts wants camelCase, not kebab-case).
 * Matches Primer's transformers/namePathToCamelCase.ts.
 */
export const namePathToCamelCase: Transform = {
  name: "name/pathToCamelCase",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => toCamelCase([options?.prefix || "", ...token.path]),
};
