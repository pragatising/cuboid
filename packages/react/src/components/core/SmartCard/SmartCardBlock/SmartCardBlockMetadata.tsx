import React from "react";
import { Box } from "../../Box";
import { Icon } from "../../Icon";
import type { IconProps } from "../../Icon";
import { Text } from "../../Text";
import { VisuallyHidden } from "../../VisuallyHidden";
import { useSmartCardContext } from "../SmartCardContext";
import classes from "./SmartCardBlock.module.css";

export type SmartCardBlockMetadataProps = Omit<React.ComponentPropsWithRef<"ul">, "color" | "children" | "content"> & {
  /** The most items to show. @default all */
  max?: number;
};

/** A row of what is known about the resource (its owner, when it changed, its state): each an optional icon and a value, the label being for assistive tech. */
export function SmartCardBlockMetadata({ max, className, ...props }: SmartCardBlockMetadataProps) {
  const { data } = useSmartCardContext("SmartCard.Block.Metadata");
  const items = data?.metadata?.slice(0, max);
  if (!items?.length) return null;
  return (
    <Box
      as="ul"
      data-component="SmartCard.Block.Metadata"
      flexDirection="row"
      flexWrap="wrap"
      alignItems="center"
      columnGap="2x"
      className={[classes.Metadata, className].filter(Boolean).join(" ")}
      {...props}
    >
      {items.map((item) => (
        <Box as="li" key={item.id} flexDirection="row" alignItems="center" gap="0.5x">
          {item.icon ? <Icon name={item.icon as IconProps["name"]} size="xs" color="neutral.muted" /> : null}
          <Text as="span" size="sm" color="neutral.muted">
            <VisuallyHidden>{item.label}: </VisuallyHidden>
            {item.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
