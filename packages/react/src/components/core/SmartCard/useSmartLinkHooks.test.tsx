import React from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SmartLinkError, type SmartLinkClient } from "./client";
import type { SmartLinkEvent } from "./events";
import type { LinkData } from "./linkData";
import { SmartCard } from "./SmartCard";
import { createSmartLinkStore } from "./store";
import { useSmartLinkActions } from "./useSmartLinkActions";
import { useSmartLinkEvents } from "./useSmartLinkEvents";
import { useSmartLinkReload } from "./useSmartLinkReload";

const URL_A = "https://example.com/a";
const link = (url: string): LinkData => ({
  url,
  title: "Doc",
  actions: [{ id: "open", label: "Open", href: "https://example.com/open" }, { id: "comment", label: "Comment" }, { id: "bad", label: "Bad", href: "javascript:alert(1)" }],
});
const clientOf = (resolve: SmartLinkClient["resolve"]) => ({ resolve: vi.fn(resolve) }) satisfies SmartLinkClient;
const wrap =
  (props: Omit<React.ComponentProps<typeof SmartCard.Provider>, "children">) =>
  ({ children }: { children: React.ReactNode }) => <SmartCard.Provider {...props}>{children}</SmartCard.Provider>;

describe("onEvent", () => {
  it("hears each request end once, however many cards show the link", async () => {
    const onEvent = vi.fn();
    render(
      <SmartCard.Provider client={clientOf(async (url) => link(url))} onEvent={onEvent}>
        <SmartCard url={URL_A} appearance="inline" />
        <SmartCard url={URL_A} appearance="inline" />
      </SmartCard.Provider>,
    );
    await waitFor(() => expect(onEvent).toHaveBeenCalled());
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: "resolved", url: URL_A, status: "resolved", data: link(URL_A) });
  });

  it("hears what a failure was, and a fallback", async () => {
    const events: SmartLinkEvent[] = [];
    render(
      <SmartCard.Provider
        client={clientOf(async (url) => {
          if (url.endsWith("/a")) throw new SmartLinkError("unauthorized");
          return null;
        })}
        onEvent={(event) => events.push(event)}
      >
        <SmartCard url={URL_A} appearance="inline" />
        <SmartCard url="https://example.com/b" appearance="inline" />
      </SmartCard.Provider>,
    );
    await waitFor(() => expect(events).toHaveLength(2));
    expect(events.map((event) => event.type === "resolved" && event.status).sort()).toEqual(["fallback", "unauthorized"]);
  });

  it("hears a click on the inline chip and on a block's title, and does not stop the link", async () => {
    const onEvent = vi.fn();
    render(
      <SmartCard.Provider client={clientOf(async (url) => link(url))} onEvent={onEvent}>
        <SmartCard url={URL_A} appearance="inline" />
        <SmartCard url="https://example.com/b" appearance="block" />
      </SmartCard.Provider>,
    );
    const links = await screen.findAllByRole("link", { name: /Doc/ });
    await userEvent.click(links[0]);
    await userEvent.click(links[1]);
    expect(onEvent).toHaveBeenCalledWith({ type: "clicked", url: URL_A, part: "inline" });
    expect(onEvent).toHaveBeenCalledWith({ type: "clicked", url: "https://example.com/b", part: "block.title" });
  });

  it("uses the newest handler without making the store again", async () => {
    const client = clientOf(async (url) => link(url));
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <SmartCard.Provider client={client} onEvent={first}>
        <SmartCard url={URL_A} appearance="inline" />
      </SmartCard.Provider>,
    );
    await screen.findByRole("link", { name: /Doc/ });
    rerender(
      <SmartCard.Provider client={client} onEvent={second}>
        <SmartCard url={URL_A} appearance="inline" />
      </SmartCard.Provider>,
    );
    await userEvent.click(screen.getByRole("link", { name: /Doc/ }));
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ type: "clicked" }));
    expect(client.resolve).toHaveBeenCalledTimes(1);
  });

  it("keeps a link resolved when the host's listener throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const uncaught = vi.fn();
    process.on("uncaughtException", uncaught);
    const store = createSmartLinkStore(clientOf(async (url) => link(url)), {
      onSettled: () => {
        throw new Error("analytics down");
      },
    });
    await store.resolve(URL_A);
    expect(store.get(URL_A).status).toBe("resolved");
    process.off("uncaughtException", uncaught);
    error.mockRestore();
  });
});

describe("useSmartLinkEvents", () => {
  it("does nothing without a provider's onEvent, and is the same function each render", () => {
    const { result, rerender } = renderHook(() => useSmartLinkEvents());
    const first = result.current;
    expect(() => first({ type: "reloaded", url: URL_A })).not.toThrow();
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useSmartLinkReload", () => {
  it("resolves again and tells the host", async () => {
    const onEvent = vi.fn();
    const client = clientOf(async (url) => link(url));
    const { result } = renderHook(() => useSmartLinkReload(URL_A), { wrapper: wrap({ client, onEvent }) });
    await act(async () => result.current());
    expect(client.resolve).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: "reloaded", url: URL_A });
  });
});

describe("useSmartLinkActions", () => {
  const ready = (props: Omit<React.ComponentProps<typeof SmartCard.Provider>, "children">, handler?: Parameters<typeof useSmartLinkActions>[1]) => {
    const hook = renderHook(() => useSmartLinkActions(URL_A, handler), { wrapper: wrap({ client: clientOf(async (url) => link(url)), ...props }) });
    return hook;
  };

  it("offers links, and buttons only when someone handles them; never an unsafe href", async () => {
    const withHandler = ready({ onAction: vi.fn() });
    await waitFor(() => expect(withHandler.result.current.actions.length).toBeGreaterThan(0));
    expect(withHandler.result.current.actions.map((item) => [item.action.id, item.kind])).toEqual([
      ["open", "link"],
      ["comment", "button"],
      ["bad", "button"],
    ]);

    const without = ready({});
    await waitFor(() => expect(without.result.current.actions.length).toBeGreaterThan(0));
    expect(without.result.current.actions.map((item) => item.action.id)).toEqual(["open"]);
  });

  it("run tells the host and calls the provider's handler with the link", async () => {
    const onAction = vi.fn();
    const onEvent = vi.fn();
    const { result } = ready({ onAction, onEvent });
    await waitFor(() => expect(result.current.actions.length).toBeGreaterThan(0));
    act(() => result.current.run({ id: "comment", label: "Comment" }));
    expect(onAction).toHaveBeenCalledWith({ id: "comment", label: "Comment" }, link(URL_A));
    expect(onEvent).toHaveBeenCalledWith({ type: "action", url: URL_A, action: { id: "comment", label: "Comment" } });
  });

  it("prefers the handler it is given to the provider's", async () => {
    const provided = vi.fn();
    const given = vi.fn();
    const { result } = ready({ onAction: provided }, given);
    await waitFor(() => expect(result.current.actions.length).toBeGreaterThan(0));
    act(() => result.current.run({ id: "comment", label: "Comment" }));
    expect(given).toHaveBeenCalledTimes(1);
    expect(provided).not.toHaveBeenCalled();
  });

  it("offers a retry only for a failure trying again can mend", async () => {
    const failing = renderHook(() => useSmartLinkActions(URL_A), {
      wrapper: wrap({ client: clientOf(async () => Promise.reject(new SmartLinkError("errored"))) }),
    });
    await waitFor(() => expect(failing.result.current.retry).toBeDefined());

    const nothing = renderHook(() => useSmartLinkActions(URL_A), { wrapper: wrap({ client: clientOf(async () => null) }) });
    await waitFor(() => expect(nothing.result.current.actions).toEqual([]));
    expect(nothing.result.current.retry).toBeUndefined();
  });
});
