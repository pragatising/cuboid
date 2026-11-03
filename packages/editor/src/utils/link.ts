/**
 * What a typed link becomes, or null when it must not be a link. Only web addresses, mail and phone links, and page-relative paths are
 * allowed: anything else (`javascript:`, `data:`) would run in the reader's page, so it is refused here, not left to the renderer.
 * A bare domain (`example.com/a`) is taken to mean `https://`.
 */
export function safeHref(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  if (/^(\/|#|\.\.?\/)/.test(value)) return value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (scheme) return /^(https?|mailto|tel)$/i.test(scheme[1]) ? value : null;
  return /^[^\s/@:]+\.[^\s/@:]+(\/.*)?$/.test(value) ? `https://${value}` : null;
}
