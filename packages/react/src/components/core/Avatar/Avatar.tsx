import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import { AvatarStack } from "./AvatarStack";
import { useAvatarStackSize } from "./AvatarStackContext";
import classes from "./Avatar.module.css";

/** A key of `tokens.avatar.size`: `sm` 20px, `md` 24px, `lg` 32px. The ring is part of the size. */
export type AvatarSize = keyof Tokens["avatar"]["size"];
/** A key of `tokens.avatar.color`. `gray` is for whoever is not known. */
export type AvatarShade = keyof Tokens["avatar"]["color"];

export type AvatarProps = Omit<React.ComponentPropsWithRef<"span">, "color" | "children"> & {
  /**
   * Who it is. The first letter is drawn, the shade follows from it (the same name is always the same colour), and it is the
   * accessible name. With neither a name nor a `src`, a person icon is drawn.
   */
  name?: string;
  /** A photo. It covers the circle; `name` is still the accessible name. */
  src?: string;
  /** Which `avatar.color` it is drawn in. @default from `name`; `gray` with no name */
  shade?: AvatarShade;
  /** @default "md", or the size of the `Avatar.Stack` it is in */
  size?: AvatarSize;
};

/** The same text is the same shade, so a person is the same colour wherever they appear. */
function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.codePointAt(0)!) >>> 0;
  return value;
}

/** A person, drawn as a circle: their photo, the first letter of their name, or a person icon, with a ring around it. */
function AvatarRoot({ name, src, shade, size, className, style, "aria-label": ariaLabel, ...props }: AvatarProps) {
  const { avatar } = useTokens();
  const stackSize = useAvatarStackSize();
  const resolvedSize = size ?? stackSize ?? "md";
  const shades = (Object.keys(avatar.color) as AvatarShade[]).filter((key) => key !== "gray");
  const trimmed = name?.trim();
  const resolvedShade: AvatarShade = shade ?? (trimmed ? shades[hash(trimmed) % shades.length] : "gray");
  const colour = avatar.color[resolvedShade];
  const label = ariaLabel ?? trimmed;

  return (
    <span
      {...mergeProps(
        {
          "data-component": "Avatar",
          "data-size": resolvedSize,
          "data-shade": resolvedShade,
          role: label ? ("img" as const) : undefined,
          "aria-label": label,
          "aria-hidden": label ? undefined : true,
          className: clsx(classes.Avatar, className),
          style: {
            ...cssVars("avatar", {
              size: avatar.size[resolvedSize],
              bg: colour.bgColor,
              fg: colour.fgColor,
              ringWidth: avatar.ring.width,
              ringColor: avatar.ring.color,
            }),
            ...style,
          },
        },
        props,
      )}
    >
      {src ? <img className={classes.Photo} src={src} alt="" /> : trimmed ? Array.from(trimmed)[0].toUpperCase() : <Icon name="person" size="xs" fill />}
    </span>
  );
}

export const Avatar = Object.assign(AvatarRoot, { Stack: AvatarStack });
