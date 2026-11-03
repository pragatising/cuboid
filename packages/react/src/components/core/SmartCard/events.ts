import type { LinkAction, LinkData, LinkStatus } from "./linkData";

/**
 * What a host can hear about the links it shows, through `SmartCard.Provider`'s `onEvent`: for analytics, or to react (open a sign-in
 * when a link comes back `unauthorized`). Nothing here changes what is drawn.
 */
export type SmartLinkEvent =
  /** A request ended: the link is `resolved`, or `fallback` (nothing understood it), or failed. Once per request, however many cards show the link. */
  | { type: "resolved"; url: string; status: Exclude<LinkStatus, "pending" | "resolving">; data?: LinkData }
  /** Someone followed the link: from the inline chip (`inline`) or a block's title (`block.title`). */
  | { type: "clicked"; url: string; part: "inline" | "block.title" }
  /** Someone pressed an action that is the host's to carry out. */
  | { type: "action"; url: string; action: LinkAction }
  /** Someone asked for the link to be resolved again. */
  | { type: "reloaded"; url: string };
