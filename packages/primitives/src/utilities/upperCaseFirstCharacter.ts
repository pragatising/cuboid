/**
 * Uppercases only the first character of a string, leaving the rest
 * unchanged. Matches Primer's utilities/upperCaseFirstCharacter.ts.
 * Intended for use inside name-path transformers, not general text.
 */
export function upperCaseFirstCharacter(word: string): string {
  const [firstLetter, ...restOfWord] = word;
  return firstLetter.toUpperCase() + restOfWord.join("");
}
