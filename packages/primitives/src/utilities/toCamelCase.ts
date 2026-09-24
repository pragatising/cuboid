import { filterStringArray } from "./filterStringArray";
import { upperCaseFirstCharacter } from "./upperCaseFirstCharacter";

/**
 * kebab-case / space-separated string (or path-segment array) -> camelCase.
 * Matches Primer's utilities/toCamelCase.ts. Used for JSON/JS output key
 * naming, where cuboid's real token paths (e.g. ["button", "bgColor"])
 * need to become "buttonBgColor", not "buttonbgcolor".
 */
export function toCamelCase(input: string | string[]): string {
  const parts = Array.isArray(input) ? input : [input];
  return filterStringArray(parts)
    .map((part, index) => (index > 0 ? upperCaseFirstCharacter(part) : part))
    .join("");
}
