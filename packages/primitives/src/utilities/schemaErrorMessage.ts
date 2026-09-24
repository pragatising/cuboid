/**
 * Formats a two-part (what's wrong / what's expected) error message
 * consistently across every schema. Matches Primer's
 * utilities/schemaErrorMessage.ts.
 */
export function schemaErrorMessage(title: string, description?: string): string {
  return `**${title}**${description ? `\n${description}` : ""}`;
}
