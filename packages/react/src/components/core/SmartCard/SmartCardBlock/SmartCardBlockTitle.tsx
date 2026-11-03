import React from "react";
import { Box } from "../../Box";
import { Icon } from "../../Icon";
import type { IconProps } from "../../Icon";
import { Link } from "../../Link";
import { Text } from "../../Text";
import { linkBase, parseLinkUrl } from "../linkUrl";
import { useSmartCardContext } from "../SmartCardContext";
import { STATUS_NOTES } from "../statusNotes";
import { useSmartLinkEvents } from "../useSmartLinkEvents";

export type SmartCardBlockTitleProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "content"> & {
  /** What goes at the end of the row: a badge, a menu. */
  children?: React.ReactNode;
};

/** The row that names the link: its icon and title, the title being the link itself. When it has no title yet, the address; when it failed, why. */
export function SmartCardBlockTitle({ children, ...props }: SmartCardBlockTitleProps) {
  const { url, status, data } = useSmartCardContext("SmartCard.Block.Title");
  const href = parseLinkUrl(url, linkBase())?.href;
  const note = STATUS_NOTES[status];
  const emit = useSmartLinkEvents();
  const title = data?.title ?? url;

  return (
    <Box data-component="SmartCard.Block.Title" flexDirection="row" alignItems="center" gap="1x" {...props}>
      <Icon name={(data?.icon ?? "link") as IconProps["name"]} color="neutral.muted" />
      <Box flexGrow={1} minWidth="0">
        <Text as="span" truncate weight="medium">
          {href ? (
            <Link href={href} external showExternalIcon={false} variant="inherit" underline="hover" onClick={() => emit({ type: "clicked", url, part: "block.title" })}>
              {title}
            </Link>
          ) : (
            title
          )}
        </Text>
        {note ? (
          <Text as="span" size="sm" color="neutral.muted">
            {note}
          </Text>
        ) : null}
      </Box>
      {children}
    </Box>
  );
}
