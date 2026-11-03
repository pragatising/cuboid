import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import type { AvatarSize } from "./Avatar";
import { AvatarStackContext } from "./AvatarStackContext";
import classes from "./Avatar.module.css";

export type AvatarStackProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** The avatars, in the order they are drawn: each overlaps the one before it. */
  children?: React.ReactNode;
  /** The size of every avatar in it. @default "md" */
  size?: AvatarSize;
  /** How many are drawn before the rest are counted (`+3`). @default 3 */
  max?: number;
  /** Shows a button after the avatars that calls this: add someone. Without it there is no button. */
  onAdd?: () => void;
  /** The button's accessible name. @default "Add person" */
  addLabel?: string;
};

/** Avatars side by side, overlapping, for the people who share something: the first few, a count of the rest, and a button to add one. */
export function AvatarStack({ children, size = "md", max = 3, onAdd, addLabel = "Add person", className, style, ...props }: AvatarStackProps) {
  const { avatar } = useTokens();
  const avatars = React.Children.toArray(children);
  const hidden = Math.max(0, avatars.length - max);

  return (
    <AvatarStackContext.Provider value={size}>
      <div
        {...mergeProps(
          {
            "data-component": "Avatar.Stack",
            role: "group" as const,
            className: clsx(classes.Stack, className),
            style: {
              ...cssVars("avatar", {
                size: avatar.size[size],
                ringWidth: avatar.ring.width,
                ringColor: avatar.ring.color,
                countBg: avatar.count.bgColor,
                countFg: avatar.count.fgColor,
                addBg: avatar.color.gray.bgColor,
                addFg: avatar.color.gray.fgColor,
              }),
              ...style,
            },
          },
          props,
        )}
      >
        {avatars.slice(0, max)}
        {hidden > 0 ? (
          <span data-component="Avatar.Count" data-size={size} role="img" aria-label={`${hidden} more`} className={classes.Count}>
            +{hidden}
          </span>
        ) : null}
        {onAdd ? (
          <button type="button" data-component="Avatar.Add" data-size={size} aria-label={addLabel} className={classes.Add} onClick={onAdd}>
            <Icon name="person_add" size="xs" fill />
          </button>
        ) : null}
      </div>
    </AvatarStackContext.Provider>
  );
}
