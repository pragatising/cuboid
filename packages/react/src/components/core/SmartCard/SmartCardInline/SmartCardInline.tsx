import React from "react";
import { clsx } from "clsx";
import { mergeProps } from "../../../../utils/mergeProps";
import { Icon } from "../../Icon";
import type { IconProps } from "../../Icon";
import { linkBase, parseLinkUrl } from "../linkUrl";
import { STATUS_NOTES } from "../statusNotes";
import { useSmartCardContext } from "../SmartCardContext";
import { useSmartLinkEvents } from "../useSmartLinkEvents";
import classes from "./SmartCardInline.module.css";

export type SmartCardInlineProps = Omit<React.ComponentPropsWithRef<"a">, "children" | "href" | "color" | "content">;

/**
 * The link as part of a line of text: an icon and the title, in a chip that wraps with the words around it. It is a link that opens in
 * a new tab, and shows the address (and why there is no title) when it cannot be resolved. A URL that is not http(s) is shown but not linked.
 */
export function SmartCardInline({ className, ...props }: SmartCardInlineProps) {
  const { url, status, data } = useSmartCardContext("SmartCard.Inline");
  const href = parseLinkUrl(url, linkBase())?.href;
  const resolving = status === "pending" || status === "resolving";
  const note = STATUS_NOTES[status];
  const emit = useSmartLinkEvents();

  const shared = {
    "data-component": "SmartCard.Inline",
    "data-status": status,
    "aria-busy": resolving && !data ? true : undefined,
    className: clsx(classes.Inline, className),
  };
  const content = (
    <>
      <span className={classes.Icon}>
        <Icon name={(data?.icon ?? "link") as IconProps["name"]} size="sm" />
      </span>
      {data?.title ?? url}
      {note ? <span className={classes.Note}> · {note}</span> : null}
    </>
  );

  return href ? (
    <a {...mergeProps({ ...shared, href, target: "_blank", rel: "noopener noreferrer", onClick: () => emit({ type: "clicked", url, part: "inline" }) }, props as object)}>{content}</a>
  ) : (
    <span {...mergeProps(shared, props as object)}>{content}</span>
  );
}
