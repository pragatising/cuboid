import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import type { CssColor } from "../../../utils/colorPaths";
import { resolved } from "../../../utils/resolved";
import type { RawLength, SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import type { BoxProps } from "../Box";
import classes from "./Callout.module.css";

type CalloutTokens = Tokens["callout"];

/**
 * A colour of the `callout` tokens: every key of `tokens.callout` that holds a `{ bgColor, fgColor }` pair (the group also
 * carries the shared padding and radius, and the default `bgColor` / `fgColor`). Add a colour to the tokens and it is a variant.
 */
export type CalloutVariant = {
  [K in keyof CalloutTokens]: CalloutTokens[K] extends { bgColor: string; fgColor: string } ? K : never;
}[keyof CalloutTokens];

export type CalloutProps = BoxProps<"div"> & {
  /** Which `callout` colour to set the surface and text from. Unset, the default callout look. */
  variant?: CalloutVariant;
};

/**
 * An inset block for notes, asides and quotes: a `Box` with the `callout` look. `variant` picks one of the token colours; it is
 * a preset, not a fence, so `backgroundColor`, `color` or any other Box prop overrides it.
 */
export function Callout({ variant, className, ...props }: CalloutProps) {
  const { callout } = useTokens();
  const colors: { bgColor: string; fgColor: string } = variant ? (callout[variant] as { bgColor: string; fgColor: string }) : callout;

  return (
    <Box
      flexDirection="column"
      boxSizing="border-box"
      backgroundColor={resolved<CssColor>(colors.bgColor)}
      color={resolved<CssColor>(colors.fgColor)}
      paddingBlock={resolved<SpaceValue>(callout.paddingBlock)}
      paddingInline={resolved<SpaceValue>(callout.paddingInline)}
      borderRadius={resolved<RawLength>(callout.borderRadius)}
      {...mergeProps({ "data-component": "Callout", "data-variant": variant, className: clsx(classes.Callout, className) }, props as object)}
    />
  );
}
