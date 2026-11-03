/**
 * What an author typed into a link field, as the URL to keep, or null when it is not one a smart link can show. A bare address (`example.com/a`)
 * is taken as https. Only http and https are links: `javascript:`, `data:` and the rest are refused here, and again where the link is drawn.
 * The URL is kept as typed (apart from the scheme added), not rewritten into the browser's normal form.
 */
export function smartLinkUrl(input: string): string | null {
  const typed = input.trim();
  if (!typed || /\s/.test(typed)) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : /^[^/?#]+\.[^/?#]+/.test(typed) ? `https://${typed}` : null;
  if (!candidate) return null;
  try {
    const { protocol } = new URL(candidate);
    return protocol === "https:" || protocol === "http:" ? candidate : null;
  } catch {
    return null;
  }
}
