/** The URL as an absolute http(s) URL, or null for anything else (`javascript:`, `data:`, not a URL). A site path resolves against `base`. */
export function parseLinkUrl(src: string, base: string): URL | null {
  try {
    const url = new URL(src, base);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** What relative URLs resolve against: the page, or a stand-in where there is none (a server render). */
export const linkBase = (): string => (typeof window === "undefined" ? "http://localhost" : window.location.href);
