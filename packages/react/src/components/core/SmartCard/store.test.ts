import { describe, expect, it, vi } from "vitest";
import { SmartLinkError, composeClients, genericClient, type SmartLinkClient } from "./client";
import type { LinkData } from "./linkData";
import { createSmartLinkStore } from "./store";

const URL_A = "https://example.com/a";
const data = (title: string): LinkData => ({ url: URL_A, title });

function clientOf(resolve: SmartLinkClient["resolve"]) {
  return { resolve: vi.fn(resolve) } satisfies SmartLinkClient;
}

describe("createSmartLinkStore", () => {
  it("starts pending, goes resolving, then resolved", async () => {
    const store = createSmartLinkStore(clientOf(async () => data("A")));
    expect(store.get(URL_A).status).toBe("pending");
    const done = store.resolve(URL_A);
    expect(store.get(URL_A).status).toBe("resolving");
    await done;
    expect(store.get(URL_A)).toEqual({ status: "resolved", data: data("A") });
  });

  it("shares one request between concurrent and later resolves", async () => {
    const client = clientOf(async () => data("A"));
    const store = createSmartLinkStore(client);
    await Promise.all([store.resolve(URL_A), store.resolve(URL_A)]);
    await store.resolve(URL_A);
    expect(client.resolve).toHaveBeenCalledTimes(1);
  });

  it("is fallback when the client does not understand the URL", async () => {
    const store = createSmartLinkStore(clientOf(async () => null));
    await store.resolve(URL_A);
    expect(store.get(URL_A)).toEqual({ status: "fallback" });
  });

  it.each(["unauthorized", "forbidden", "not_found"] as const)("maps SmartLinkError(%s) to that status", async (status) => {
    const store = createSmartLinkStore(
      clientOf(async () => {
        throw new SmartLinkError(status);
      }),
    );
    await store.resolve(URL_A);
    expect(store.get(URL_A).status).toBe(status);
  });

  it("maps any other error to errored", async () => {
    const store = createSmartLinkStore(
      clientOf(async () => {
        throw new Error("network");
      }),
    );
    await store.resolve(URL_A);
    expect(store.get(URL_A).status).toBe("errored");
  });

  it("keeps the old data on screen during a reload and after a failed one", async () => {
    let attempt = 0;
    const store = createSmartLinkStore(
      clientOf(async () => {
        if (++attempt === 1) return data("old");
        throw new SmartLinkError("errored");
      }),
    );
    await store.resolve(URL_A);
    const reloading = store.reload(URL_A);
    expect(store.get(URL_A)).toEqual({ status: "resolving", data: data("old") });
    await reloading;
    expect(store.get(URL_A)).toEqual({ status: "errored", data: data("old") });
  });

  it("ignores a superseded request when a reload starts", async () => {
    const resolvers: Array<(value: LinkData) => void> = [];
    const store = createSmartLinkStore(clientOf(() => new Promise<LinkData>((resolve) => resolvers.push(resolve))));
    const first = store.resolve(URL_A);
    const second = store.reload(URL_A);
    resolvers[0](data("stale"));
    resolvers[1](data("fresh"));
    await Promise.all([first, second]);
    expect(store.get(URL_A).data?.title).toBe("fresh");
  });

  it("notifies subscribers of that URL only, and stops after unsubscribe", async () => {
    const store = createSmartLinkStore(clientOf(async () => data("A")));
    const forA = vi.fn();
    const forB = vi.fn();
    const unsubscribe = store.subscribe(URL_A, forA);
    store.subscribe("https://example.com/b", forB);
    await store.resolve(URL_A);
    expect(forA).toHaveBeenCalledTimes(2);
    expect(forB).not.toHaveBeenCalled();
    unsubscribe();
    await store.reload(URL_A);
    expect(forA).toHaveBeenCalledTimes(2);
  });

  it("returns the same snapshot object until something changes", async () => {
    const store = createSmartLinkStore(clientOf(async () => data("A")));
    await store.resolve(URL_A);
    expect(store.get(URL_A)).toBe(store.get(URL_A));
  });
});

describe("clients", () => {
  const signal = new AbortController().signal;

  it("genericClient titles an http(s) URL by host and path and embeds it as itself", async () => {
    expect(await genericClient.resolve("https://www.example.com/docs/intro", { signal })).toEqual({
      url: "https://www.example.com/docs/intro",
      title: "example.com/docs/intro",
      provider: "example.com",
      embedUrl: "https://www.example.com/docs/intro",
    });
  });

  it("genericClient does not understand non-http URLs or non-URLs", async () => {
    expect(await genericClient.resolve("javascript:alert(1)", { signal })).toBeNull();
    expect(await genericClient.resolve("not a url", { signal })).toBeNull();
  });

  it("composeClients lets the first client that understands the URL win", async () => {
    const special = clientOf(async (url) => (url.includes("special") ? { url, title: "Special" } : null));
    const composed = composeClients(special, genericClient);
    expect((await composed.resolve("https://x.com/special", { signal }))?.title).toBe("Special");
    expect((await composed.resolve("https://x.com/plain", { signal }))?.title).toBe("x.com/plain");
  });
});
