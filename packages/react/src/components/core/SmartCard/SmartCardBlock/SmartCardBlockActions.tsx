import React from "react";
import { Box } from "../../Box";
import { Button } from "../../Button";
import { Link } from "../../Link";
import type { LinkAction, LinkData } from "../linkData";
import { useSmartCardContext } from "../SmartCardContext";
import { useSmartLinkActions } from "../useSmartLinkActions";

export type SmartCardBlockActionsProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "children" | "content"> & {
  /** Carries out an action that is not a link, in place of the provider's `onAction`: what it does is the host's to say. */
  onAction?: (action: LinkAction, link: LinkData | undefined) => void;
};

/**
 * The buttons the link offers (`useSmartLinkActions`): an action with a `href` is a link, any other is a button that calls `onAction` (and
 * is not drawn without one). A link that failed in a way trying again can mend offers "Try again" as well. Nothing is drawn when there is nothing to press.
 */
export function SmartCardBlockActions({ onAction, ...props }: SmartCardBlockActionsProps) {
  const { url } = useSmartCardContext("SmartCard.Block.Actions");
  const { actions, run, retry } = useSmartLinkActions(url, onAction);
  if (!actions.length && !retry) return null;
  return (
    <Box data-component="SmartCard.Block.Actions" flexDirection="row" flexWrap="wrap" alignItems="center" gap="2x" {...props}>
      {actions.map((item) =>
        item.kind === "link" ? (
          <Link key={item.action.id} href={item.href} external size="sm">
            {item.action.label}
          </Link>
        ) : (
          <Button key={item.action.id} size="sm" onClick={() => run(item.action)}>
            {item.action.label}
          </Button>
        ),
      )}
      {retry ? (
        <Button size="sm" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </Box>
  );
}
