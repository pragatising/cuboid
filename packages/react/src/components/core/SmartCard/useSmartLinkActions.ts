import { useCallback, useMemo } from "react";
import type { LinkAction, LinkData } from "./linkData";
import { linkBase, parseLinkUrl } from "./linkUrl";
import { useSmartLinkHost } from "./SmartLinkContext";
import { RETRYABLE } from "./statusNotes";
import { useSmartLink } from "./useSmartLink";
import { useSmartLinkEvents } from "./useSmartLinkEvents";

/** An action as it is carried out: a `link` is followed by the browser (`href` is safe to use), a `button` by the host. */
export type SmartLinkActionItem = { action: LinkAction; kind: "link"; href: string } | { action: LinkAction; kind: "button" };

export type UseSmartLinkActionsResult = {
  /** What the link offers that can be carried out here: its actions that are links, and those the host handles. */
  actions: SmartLinkActionItem[];
  /** Carries out a `button` action: tells the host (`action`) and calls its handler. */
  run: (action: LinkAction) => void;
  /** Resolves the link again, when it failed in a way trying again can mend; undefined when it did not. */
  retry: (() => void) | undefined;
};

/**
 * What can be done with a link. An action with a `href` is a link; any other needs a handler, `onAction` here or the provider's, and
 * is left out without one, so nothing offered is a button that does nothing.
 */
export function useSmartLinkActions(url: string, onAction?: (action: LinkAction, link: LinkData | undefined) => void): UseSmartLinkActionsResult {
  const { status, data, reload } = useSmartLink(url);
  const host = useSmartLinkHost();
  const emit = useSmartLinkEvents();
  const handler = onAction ?? host.onAction;

  const actions = useMemo(
    () =>
      (data?.actions ?? []).flatMap((action): SmartLinkActionItem[] => {
        const href = action.href ? parseLinkUrl(action.href, linkBase())?.href : undefined;
        return href ? [{ action, kind: "link", href }] : handler ? [{ action, kind: "button" }] : [];
      }),
    [data, handler],
  );

  const run = useCallback(
    (action: LinkAction) => {
      emit({ type: "action", url, action });
      (onAction ?? host.onAction)?.(action, data);
    },
    [emit, url, onAction, host, data],
  );

  return { actions, run, retry: RETRYABLE.has(status) ? reload : undefined };
}
