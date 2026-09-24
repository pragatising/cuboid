/**
 * Lowercases only the first character of a string, leaving the rest
 * unchanged. Matches Primer's utilities/lowerCaseFirstCharacter.ts.
 * Intended for use inside name-path transformers, not general text.
 */
export function lowerCaseFirstCharacter(word: string): string {
  const [firstLetter, ...restOfWord] = word;
  return firstLetter.toLowerCase() + restOfWord.join("");
}
