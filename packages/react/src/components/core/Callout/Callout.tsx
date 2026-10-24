import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import type { CssColor } from "../../../utils/colorPaths";
import { resolved } from "../../../utils/resolved";
import type { RawLength, SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import type { BoxProps } from "../Box";
import classes from "./Callout.module.css";

export type CalloutProps = BoxProps<"div">;

/**
 * An inset block for notes, asides and quotes: a `Box` with the `callout` look. It has no variants: set the surface with
 * `backgroundColor` (any `bgColor` token, such as `"informational.subtle"`, or any CSS colour), the text with `color`, and
 * anything else with the Box props.
 */
export function Callout({ className, ...props }: CalloutProps) {
  const { callout } = useTokens();

  return (
    <Box
      flexDirection="column"
      boxSizing="border-box"
      backgroundColor={resolved<CssColor>(callout.bgColor)}
      color={resolved<CssColor>(callout.fgColor)}
      paddingBlock={resolved<SpaceValue>(callout.paddingBlock)}
      paddingInline={resolved<SpaceValue>(callout.paddingInline)}
      borderRadius={resolved<RawLength>(callout.borderRadius)}
      {...mergeProps({ "data-component": "Callout", className: clsx(classes.Callout, className) }, props as object)}
    />
  );
}
