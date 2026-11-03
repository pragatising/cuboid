/**
 * What a Smart Link is, independent of how it is shown. A resolver turns a URL
 * into `LinkData`; every appearance (inline, block, embed) reads the same object.
 * Nothing here knows about a provider: Figma, Storybook and the rest are
 * resolvers the host registers, and the Block parts decide what to show.
 */

/** Where a link is in its life. `pending` = not requested yet; `fallback` = no resolver understood it. */
export type LinkStatus =
  | "pending"
  | "resolving"
  | "resolved"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "errored"
  | "fallback";

/** The statuses a failed resolve can end in. */
export type LinkFailureStatus = Extract<LinkStatus, "unauthorized" | "forbidden" | "not_found" | "errored">;

export type LinkMetadata = {
  id: string;
  label: string;
  value: string;
  /** Icon name, shown before the value. */
  icon?: string;
};

export type LinkAction = {
  id: string;
  label: string;
  icon?: string;
  /** Opens a URL; the host's `onAction` handles anything without one. */
  href?: string;
};

export type LinkData = {
  /** The URL as the author gave it. */
  url: string;
  title: string;
  /** Name of the service the link belongs to, e.g. "Figma". */
  provider?: string;
  icon?: string;
  /** A text excerpt from the linked resource. */
  snippet?: string;
  /** Image URL for a preview block. */
  preview?: string;
  /** What an Embed frames. Absent = the link cannot be embedded. */
  embedUrl?: string;
  metadata?: LinkMetadata[];
  actions?: LinkAction[];
};

/** What a component reads: the status, and the data once there is any (kept while a reload runs). */
export type LinkSnapshot = {
  status: LinkStatus;
  data?: LinkData;
};
