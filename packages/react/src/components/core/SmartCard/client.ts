import type { LinkData, LinkFailureStatus } from "./linkData";

/** Thrown by a client to say why a link could not be resolved. Anything else thrown becomes `errored`. */
export class SmartLinkError extends Error {
  readonly status: LinkFailureStatus;

  constructor(status: LinkFailureStatus, message?: string) {
    super(message ?? status);
    this.name = "SmartLinkError";
    this.status = status;
  }
}

export type SmartLinkClient = {
  /**
   * Turn a URL into `LinkData`. Resolve `null` when this client does not
   * understand the URL (the link then shows as a plain link, status `fallback`).
   */
  resolve(url: string, options: { signal: AbortSignal }): Promise<LinkData | null>;
};

/** Try each client in order; the first that understands the URL wins. */
export function composeClients(...clients: SmartLinkClient[]): SmartLinkClient {
  return {
    async resolve(url, options) {
      for (const client of clients) {
        const data = await client.resolve(url, options);
        if (data) return data;
      }
      return null;
    },
  };
}

/**
 * The only resolver the library ships: any http(s) URL becomes a link titled by
 * its host and path, embeddable as itself. A host puts richer clients in front.
 */
export const genericClient: SmartLinkClient = {
  async resolve(url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return { url, title: `${host}${path}`, provider: host, embedUrl: url };
  },
};
