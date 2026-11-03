import { SmartCard, SmartLinkError, composeClients, genericClient } from "@sragatiping/cuboid";
import type { SmartLinkClient } from "@sragatiping/cuboid";

export function Default() {
  return <SmartCard url="https://example.com" />;
}

export function Inline() {
  return (
    <p>
      The brief is <SmartCard url="https://example.com/brief" appearance="inline" /> and the first draft is{" "}
      <SmartCard url="https://example.com/a-link-with-a-very-long-address-that-wraps-onto-a-second-line-of-text" appearance="inline" />.
    </p>
  );
}

// What a client says of a link beyond its title: whatever the service it belongs to knows. Every part draws only what is here.
const checkoutDoc: SmartLinkClient = {
  async resolve(url) {
    return {
      url,
      title: "Checkout redesign",
      provider: "Docs",
      icon: "description",
      snippet: "A proposal to cut the checkout from five steps to three, with the research behind it and the open questions for engineering.",
      preview: "https://picsum.photos/id/1015/640/360",
      metadata: [
        { id: "owner", label: "Owner", value: "Ada Lovelace", icon: "person" },
        { id: "edited", label: "Edited", value: "2 days ago", icon: "schedule" },
      ],
      actions: [
        { id: "open", label: "Open", href: url },
        { id: "comment", label: "Comment" },
      ],
    };
  },
};

export function Block() {
  return (
    <SmartCard.Provider client={checkoutDoc}>
      <SmartCard url="https://docs.example.com/checkout" appearance="block" />
    </SmartCard.Provider>
  );
}

export function BlockComposed() {
  return (
    <SmartCard.Provider client={checkoutDoc}>
      <SmartCard url="https://docs.example.com/checkout">
        <SmartCard.Block>
          <SmartCard.Block.Title />
          <SmartCard.Block.Snippet lines={2} />
          <SmartCard.Block.Footer>
            <SmartCard.Block.Actions onAction={(action) => console.log(action.id)} />
          </SmartCard.Block.Footer>
        </SmartCard.Block>
      </SmartCard>
    </SmartCard.Provider>
  );
}

// The host hears what happens to its links, and carries out the actions that are its own.
export function HostHandlers() {
  return (
    <SmartCard.Provider
      client={checkoutDoc}
      onEvent={(event) => console.log("smart link", event.type, event)}
      onAction={(action, link) => window.alert(`${action.label}: ${link?.title}`)}
    >
      <SmartCard url="https://docs.example.com/checkout" appearance="block" />
    </SmartCard.Provider>
  );
}

export function BlockSignInNeeded() {
  return (
    <SmartCard.Provider client={{ resolve: () => Promise.reject(new SmartLinkError("unauthorized")) }}>
      <SmartCard url="https://docs.example.com/private" appearance="block" />
    </SmartCard.Provider>
  );
}

export function Ratio() {
  return <SmartCard url="https://example.com" embed={{ height: "16:9" }} />;
}

// A client that knows one service puts its rules in front of `genericClient`.
const prototypes: SmartLinkClient = {
  async resolve(url) {
    if (!url.startsWith("https://proto.example.com/")) return null;
    return { url, title: "Checkout prototype", provider: "Proto", embedUrl: url.replace("proto.", "embed.") };
  },
};

export function OwnClient() {
  return (
    <SmartCard.Provider client={composeClients(prototypes, genericClient)}>
      <SmartCard url="https://example.com" />
    </SmartCard.Provider>
  );
}

const slow: SmartLinkClient = { resolve: () => new Promise(() => {}) };

export function Loading() {
  return (
    <SmartCard.Provider client={slow}>
      <SmartCard url="https://example.com/slow" />
    </SmartCard.Provider>
  );
}

const denied: SmartLinkClient = {
  async resolve() {
    throw new SmartLinkError("unauthorized");
  },
};

export function SignInNeeded() {
  return (
    <SmartCard.Provider client={denied}>
      <SmartCard url="https://example.com/private" />
    </SmartCard.Provider>
  );
}

const missing: SmartLinkClient = {
  async resolve() {
    throw new SmartLinkError("not_found");
  },
};

export function NotFound() {
  return (
    <SmartCard.Provider client={missing}>
      <SmartCard url="https://example.com/gone" />
    </SmartCard.Provider>
  );
}
