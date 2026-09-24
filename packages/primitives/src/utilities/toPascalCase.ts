import { filterStringArray } from "./filterStringArray.ts";
import { upperCaseFirstCharacter } from "./upperCaseFirstCharacter.ts";

/**
 * kebab-case / space-separated string (or path-segment array) -> PascalCase.
 * Matches Primer's utilities/toPascalCase.ts. Used for generated type names.
 */
export function toPascalCase(input: string | string[]): string {
  const parts = Array.isArray(input) ? input : [input];
  return filterStringArray(parts).map(upperCaseFirstCharacter).join("");
}
