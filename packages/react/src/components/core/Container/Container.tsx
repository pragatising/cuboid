import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { resolveSpace } from "../../../utils/space";
import type { Space } from "../../../utils/space";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import { Box } from "../Box";
import type { BoxOwnProps } from "../Box";
import classes from "./Container.module.css";

/** A key of `tokens.container.maxWidth`. */
export type ContainerWidth = keyof Tokens["container"]["maxWidth"];

export type ContainerProps<As extends React.ElementType = "div"> = PolymorphicProps<
  As,
  "div",
  Omit<BoxOwnProps, "width" | "maxWidth" | "minHeight" | `padding${string}` | `margin${string}`> & {
    /** Max content width: `page` (site shell), `content` (reading column) or `full`. @default "page" */
    width?: ContainerWidth;
    /** Center horizontally with `margin-inline: auto`. @default true */
    center?: boolean;
    /** Inline padding: a spacing token, or `false` for none. @default the `container.paddingInline` token */
    paddingInline?: Space | false;
    /** Block padding: a spacing token, or `false` for none. @default the `container.paddingBlock` token */
    paddingBlock?: Space | false;
    /** Minimum block size: `screen` sets the `container.minHeight.screen` token (`100svh`). */
    minHeight?: keyof Tokens["container"]["minHeight"];
  }
>;

/**
 * Page shell: max width, padding, and optional vertical fill, as a flex column (it is a `Box`).
 * Replaces ad-hoc `#root` / layout wrapper CSS in consuming apps.
 */
export function Container<As extends React.ElementType = "div">({
  as,
  width = "page",
  center = true,
  paddingInline,
  paddingBlock,
  minHeight,
  className,
  style,
  ...props
}: ContainerProps<As>) {
  const tokens = useTokens();
  const { container } = tokens;
  const padding = (value: Space | false | undefined, fallback: string) =>
    value === false ? "0" : value === undefined ? fallback : resolveSpace(tokens, value);

  return (
    <Box
      {...(props as object)}
      as={as as React.ElementType}
      data-component="Container"
      className={clsx(classes.Container, className as string | undefined)}
      maxWidth={container.maxWidth[width]}
      minHeight={minHeight ? container.minHeight[minHeight] : undefined}
      style={{
        marginInline: center ? "auto" : "0",
        paddingInline: padding(paddingInline, container.paddingInline),
        paddingBlock: padding(paddingBlock, container.paddingBlock),
        ...(style as React.CSSProperties | undefined),
      }}
    />
  );
}
