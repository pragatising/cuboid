import { toPascalCase } from "../utilities/toPascalCase";
import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Token path segments -> one PascalCase key — for generated type names.
 * Matches Primer's transformers/namePathToPascalCase.ts.
 */
export const namePathToPascalCase: Transform = {
  name: "name/pathToPascalCase",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => toPascalCase([options?.prefix || "", ...token.path]),
};
