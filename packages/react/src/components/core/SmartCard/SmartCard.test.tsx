import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../test/testing";
import { SmartLinkError, composeClients, genericClient, type SmartLinkClient } from "./client";
import { SmartCard } from "./SmartCard";
import { EMBED_SANDBOX } from "./SmartCardEmbed";

const URL_A = "https://example.com/a";
const frame = () => document.querySelector("iframe");

const clientOf = (resolve: SmartLinkClient["resolve"]) => ({ resolve: vi.fn(resolve) }) satisfies SmartLinkClient;

const setup = (client: SmartLinkClient, props: Partial<React.ComponentProps<typeof SmartCard>> = {}) =>
  render(
    <SmartCard.Provider client={client}>
      <SmartCard url={URL_A} {...props} />
    </SmartCard.Provider>,
  );

describe("SmartCard embed", () => {
  it("says it is loading, then frames the embed URL", async () => {
    setup(genericClient);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(await screen.findByTitle("example.com/a")).toBe(frame());
    expect(frame()).toHaveAttribute("src", URL_A);
  });

  it("sandboxes and lazy-loads the frame", async () => {
    setup(genericClient);
    await screen.findByTitle("example.com/a");
    expect(frame()).toHaveAttribute("sandbox", EMBED_SANDBOX);
    expect(frame()).toHaveAttribute("loading", "lazy");
  });

  it("takes sandbox, title and height from props", async () => {
    setup(genericClient, { embed: { sandbox: "allow-scripts", title: "Prototype", height: "16:9" } });
    await screen.findByTitle("Prototype");
    expect(frame()).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame()?.style.aspectRatio).toBe("16 / 9");
  });

  it("frames what a client in front of the generic one says to embed", async () => {
    const client = composeClients(
      clientOf(async (url) => ({ url, title: "Prototype", embedUrl: "https://embed.example.com/p" })),
      genericClient,
    );
    setup(client);
    expect(await screen.findByTitle("Prototype")).toHaveAttribute("src", "https://embed.example.com/p");
  });

  it("never frames a non-http(s) embed URL", async () => {
    setup(clientOf(async (url) => ({ url, title: "Bad", embedUrl: "javascript:alert(1)" })));
    expect(await screen.findByText("This link can't be shown here.")).toBeInTheDocument();
    expect(frame()).toBeNull();
  });

  it("offers the link itself when the client does not understand it", async () => {
    setup(clientOf(async () => null));
    expect(await screen.findByRole("link", { name: URL_A })).toHaveAttribute("href", URL_A);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it.each([
    ["unauthorized", "You need to sign in to see this."],
    ["forbidden", "You don't have access to this."],
    ["not_found", "This link can't be found."],
  ] as const)("says what %s means", async (status, message) => {
    setup(
      clientOf(async () => {
        throw new SmartLinkError(status);
      }),
    );
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("retries on 'Try again'", async () => {
    let attempt = 0;
    const client = clientOf(async (url) => {
      if (++attempt === 1) throw new Error("network");
      return { url, title: "Back", embedUrl: url };
    });
    setup(client);
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByTitle("Back")).toBeInTheDocument();
    expect(client.resolve).toHaveBeenCalledTimes(2);
  });

  it("resolves a URL once however many cards show it", async () => {
    const client = clientOf(async (url) => ({ url, title: "One", embedUrl: url }));
    render(
      <SmartCard.Provider client={client}>
        <SmartCard url={URL_A} />
        <SmartCard url={URL_A} />
      </SmartCard.Provider>,
    );
    await screen.findAllByTitle("One");
    expect(client.resolve).toHaveBeenCalledTimes(1);
  });

  it("marks its root with the dotted component name and the status", async () => {
    setup(genericClient);
    await screen.findByTitle("example.com/a");
    const root = document.querySelector('[data-component="SmartCard.Embed"]');
    expect(root).toHaveAttribute("data-status", "resolved");
  });

  it("composes: a part outside a card throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SmartCard.Embed />)).toThrow("SmartCard.Embed must be used inside a SmartCard");
    error.mockRestore();
  });

  // axe cannot enter an iframe under jsdom; the frame's accessible name is asserted above.
  it("has no axe violations while loading or when failed", async () => {
    const loading = setup(clientOf(() => new Promise(() => {})));
    await expectNoAxeViolations(loading.container);
    loading.unmount();
    const failed = setup(
      clientOf(async () => {
        throw new SmartLinkError("forbidden");
      }),
    );
    await screen.findByText("You don't have access to this.");
    await expectNoAxeViolations(failed.container);
  });
});

describe("SmartCard inline", () => {
  const inline = () => document.querySelector<HTMLElement>('[data-component="SmartCard.Inline"]')!;

  it("is a link to the URL that opens in a new tab, with the resolved title", async () => {
    setup(
      clientOf(async (url) => ({ url, title: "Design brief", icon: "description" })),
      { appearance: "inline" },
    );
    const link = await screen.findByRole("link", { name: /Design brief/ });
    expect(link).toHaveAttribute("href", URL_A);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toBe(inline());
  });

  it("shows the address, busy, while it resolves", () => {
    setup(clientOf(() => new Promise(() => {})), { appearance: "inline" });
    expect(inline()).toHaveTextContent(URL_A);
    expect(inline()).toHaveAttribute("aria-busy", "true");
  });

  it("is a plain link on the address when the client does not understand it", async () => {
    setup(clientOf(async () => null), { appearance: "inline" });
    await screen.findByText(URL_A);
    expect(inline()).toHaveAttribute("data-status", "fallback");
    expect(inline()).not.toHaveAttribute("aria-busy");
  });

  it.each([
    ["unauthorized", "Sign in to view"],
    ["forbidden", "No access"],
    ["not_found", "Not found"],
    ["errored", "Couldn't load"],
  ] as const)("says why on %s, and is still a link", async (status, note) => {
    setup(
      clientOf(async () => {
        throw new SmartLinkError(status);
      }),
      { appearance: "inline" },
    );
    expect(await screen.findByText(new RegExp(note))).toBeInTheDocument();
    expect(inline().tagName).toBe("A");
  });

  it("does not link a URL that is not http(s)", async () => {
    setup(clientOf(async () => null), { appearance: "inline", url: "javascript:alert(1)" });
    await screen.findByText("javascript:alert(1)");
    expect(inline().tagName).toBe("SPAN");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("takes className and props, and is composed as SmartCard.Inline", async () => {
    render(
      <SmartCard.Provider client={genericClient}>
        <SmartCard url={URL_A}>
          <SmartCard.Inline className="mine" data-testid="chip" />
        </SmartCard>
      </SmartCard.Provider>,
    );
    const chip = await screen.findByTestId("chip");
    expect(chip).toHaveClass("mine");
    expect(chip).toHaveAttribute("data-component", "SmartCard.Inline");
  });

  it("has no axe violations", async () => {
    const { container } = setup(genericClient, { appearance: "inline" });
    await screen.findByRole("link", { name: /example.com/ });
    await expectNoAxeViolations(container);
  });
});

describe("SmartCard block", () => {
  const rich = (url: string) => ({
    url,
    title: "Checkout redesign",
    provider: "Docs",
    icon: "description",
    snippet: "A proposal to cut the checkout from five steps to three.",
    preview: "https://img.example.com/cover.png",
    metadata: [
      { id: "owner", label: "Owner", value: "Ada", icon: "person" },
      { id: "edited", label: "Edited", value: "2 days ago" },
    ],
    actions: [
      { id: "open", label: "Open", href: "https://example.com/open" },
      { id: "comment", label: "Comment" },
    ],
  });
  const block = () => document.querySelector<HTMLElement>('[data-component="SmartCard.Block"]')!;
  const part = (name: string) => document.querySelector<HTMLElement>(`[data-component="SmartCard.Block.${name}"]`);

  it("by default holds the title, snippet, metadata, preview and footer the link has", async () => {
    setup(clientOf(async (url) => rich(url)), { appearance: "block" });
    expect(await screen.findByRole("link", { name: "Checkout redesign" })).toHaveAttribute("href", URL_A);
    expect(part("Snippet")).toHaveTextContent("A proposal to cut the checkout");
    expect(part("Metadata")).toHaveTextContent("Owner: Ada");
    expect(part("Metadata")).toHaveTextContent("Edited: 2 days ago");
    expect(part("Preview")?.querySelector("img")).toHaveAttribute("src", "https://img.example.com/cover.png");
    expect(part("Footer")).toHaveTextContent("Docs");
    // The actions the host need not handle: a link is drawn, a button with nobody to tell is not.
    expect(within(part("Actions")!).getByRole("link", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comment" })).toBeNull();
    expect(block()).toBeInTheDocument();
  });

  it("draws only the parts the link has something for", async () => {
    setup(genericClient, { appearance: "block" });
    await screen.findByRole("link", { name: "example.com/a" });
    expect(part("Title")).toBeInTheDocument();
    expect(part("Footer")).toHaveTextContent("example.com");
    for (const name of ["Snippet", "Metadata", "Preview", "Actions"]) expect(part(name)).toBeNull();
  });

  it("is composed from the parts you give it, and only those", async () => {
    render(
      <SmartCard.Provider client={clientOf(async (url) => rich(url))}>
        <SmartCard url={URL_A}>
          <SmartCard.Block>
            <SmartCard.Block.Title />
            <SmartCard.Block.Snippet lines={1} />
            <SmartCard.Block.Metadata max={1} />
          </SmartCard.Block>
        </SmartCard>
      </SmartCard.Provider>,
    );
    await screen.findByRole("link", { name: "Checkout redesign" });
    expect(part("Snippet")?.style.getPropertyValue("--smartcard-snippet-lines")).toBe("1");
    expect(part("Metadata")?.querySelectorAll("li")).toHaveLength(1);
    expect(part("Preview")).toBeNull();
    expect(part("Footer")).toBeNull();
  });

  it("makes a link of an action with a href and a button of one without, which calls onAction", async () => {
    const onAction = vi.fn();
    render(
      <SmartCard.Provider client={clientOf(async (url) => rich(url))}>
        <SmartCard url={URL_A}>
          <SmartCard.Block>
            <SmartCard.Block.Actions onAction={onAction} />
          </SmartCard.Block>
        </SmartCard>
      </SmartCard.Provider>,
    );
    expect(await screen.findByRole("link", { name: "Open" })).toHaveAttribute("href", "https://example.com/open");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));
    expect(onAction).toHaveBeenCalledWith({ id: "comment", label: "Comment" }, expect.objectContaining({ title: "Checkout redesign" }));
  });

  it("does not link an action or draw a picture whose URL is not http(s)", async () => {
    const hostile = (url: string) => ({ ...rich(url), preview: "javascript:alert(1)", actions: [{ id: "x", label: "Go", href: "javascript:alert(1)" }] });
    render(
      <SmartCard.Provider client={clientOf(async (url) => hostile(url))}>
        <SmartCard url={URL_A} appearance="block" block={{ children: <><SmartCard.Block.Preview /><SmartCard.Block.Actions onAction={() => {}} /></> }} />
      </SmartCard.Provider>,
    );
    await screen.findByRole("button", { name: "Go" });
    expect(screen.queryByRole("link", { name: "Go" })).toBeNull();
    expect(part("Preview")).toBeNull();
  });

  it("says why and offers 'Try again' when the link failed, and does not link an address that is not http(s)", async () => {
    let attempt = 0;
    setup(
      clientOf(async (url) => {
        if (++attempt === 1) throw new SmartLinkError("unauthorized");
        return rich(url);
      }),
      { appearance: "block" },
    );
    expect(await screen.findByText("Sign in to view")).toBeInTheDocument();
    expect(part("Title")).toHaveTextContent(URL_A);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "Checkout redesign" })).toBeInTheDocument();
  });

  it("shows the address, and no retry, while it resolves or when nothing understood it", async () => {
    setup(clientOf(async () => null), { appearance: "block" });
    await screen.findByRole("link", { name: URL_A });
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SmartCard.Provider client={clientOf(async (url) => rich(url))}>
        <SmartCard url={URL_A} appearance="block" block={{ "aria-label": "Link card", role: "group" }} />
      </SmartCard.Provider>,
    );
    await screen.findByRole("link", { name: "Checkout redesign" });
    await expectNoAxeViolations(container);
  });
});
