import { filterStringArray } from "./filterStringArray";
import { upperCaseFirstCharacter } from "./upperCaseFirstCharacter";

/**
 * kebab-case / space-separated string (or path-segment array) -> PascalCase.
 * Matches Primer's utilities/toPascalCase.ts. Used for generated type names.
 */
export function toPascalCase(input: string | string[]): string {
  const parts = Array.isArray(input) ? input : [input];
  return filterStringArray(parts).map(upperCaseFirstCharacter).join("");
}
