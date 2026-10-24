import React from "react";
import { clsx } from "clsx";
import { isPresent } from "../../../utils/isPresent";
import { mergeProps } from "../../../utils/mergeProps";
import { Text } from "../Text";
import { TileIcon } from "../TileIcon";
import type { TileIconProps } from "../TileIcon";
import classes from "./EmptyState.module.css";

export type EmptyStateProps = Omit<React.ComponentPropsWithRef<"div">, "children" | "title"> & {
  /** `default` stacks the icon, heading and description, centred. `compact` puts the icon beside the description, for a small list. @default "default" */
  layout?: "default" | "compact";
  /** The glyph in the tile above (or beside) the text. Leave out for no icon. */
  icon?: TileIconProps["name"];
  /** Passed to the icon's tile: its fill and glyph colour. */
  iconProps?: Omit<TileIconProps, "name">;
  /** The short statement ("No results"). Not shown in the `compact` layout. */
  heading?: React.ReactNode;
  /** What to do about it, or why ("Try a different search"). */
  description?: React.ReactNode;
};

/**
 * What a list, menu or panel shows when it has nothing to show: an optional icon in a tile, a heading and a description. It
 * has no tokens of its own; the type is `Text` and the spacing is the size scale. Give it a `role="status"` (or put it in a live
 * region) when it should be announced as it appears, as a search with no results is.
 */
export function EmptyState({ layout = "default", icon, iconProps, heading, description, className, ...props }: EmptyStateProps) {
  const compact = layout === "compact";

  return (
    <div {...mergeProps({ "data-component": "EmptyState", "data-layout": layout, className: clsx(classes.EmptyState, className) }, props as object)}>
      {icon ? <TileIcon {...iconProps} name={icon} /> : null}
      {compact ? (
        isPresent(description) ? (
          <Text as="span" size="sm" weight="medium" color="neutral.muted" className={classes.Description}>
            {description}
          </Text>
        ) : null
      ) : isPresent(heading) || isPresent(description) ? (
        <div className={classes.Text}>
          {isPresent(heading) ? (
            <Text as="p" size="sm" weight="semibold" color="neutral.contrast" className={classes.Heading}>
              {heading}
            </Text>
          ) : null}
          {isPresent(description) ? (
            <Text as="p" size="sm" weight="medium" color="neutral.muted" className={classes.Description}>
              {description}
            </Text>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
