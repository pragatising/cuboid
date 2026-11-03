import React from "react";
import { ButtonBase } from "./ButtonBase";
import type { ButtonProps } from "./types";

export function Button(props: ButtonProps) {
  return <ButtonBase as="button" data-component="Button" {...(props as React.ComponentProps<typeof ButtonBase>)} />;
}
