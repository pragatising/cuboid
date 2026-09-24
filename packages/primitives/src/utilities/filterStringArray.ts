/**
 * Splits and normalizes a string array into individual word tokens —
 * joins them, replaces any run of non-alphanumeric characters with a
 * single space, then splits back into words. Matches Primer's
 * utilities/filterStringArray.ts exactly.
 */
export function filterStringArray(strings: string[]): string[] {
  const regex = /[^a-zA-Z0-9]+/g;
  return strings
    .filter(Boolean)
    .join(" ")
    .replace(regex, " ")
    .split(" ")
    .filter((part): part is string => Boolean(part) && typeof part === "string");
}
