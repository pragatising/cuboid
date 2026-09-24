/**
 * True if a string contains a space — used by fontFamilyToCss.ts to decide
 * whether a family name needs quoting ("Segoe UI" does, Inter doesn't).
 * Matches Primer's transformers/utilities/hasSpaceInString.ts.
 */
export function hasSpaceInString(value: string): boolean {
  if (typeof value !== "string") {
    throw new TypeError(`Invalid input. Input must be a string, ${typeof value} provided`);
  }
  return /\s/g.test(value);
}
