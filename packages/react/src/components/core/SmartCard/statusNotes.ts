import type { LinkStatus } from "./linkData";

/** What each status that leaves a link without a title of its own says after its address. */
export const STATUS_NOTES: Partial<Record<LinkStatus, string>> = {
  unauthorized: "Sign in to view",
  forbidden: "No access",
  not_found: "Not found",
  errored: "Couldn't load",
};

/** The statuses a link can be tried again from. `fallback` is not one: nothing failed, nothing understood it. */
export const RETRYABLE: ReadonlySet<LinkStatus> = new Set(["unauthorized", "forbidden", "not_found", "errored"]);
