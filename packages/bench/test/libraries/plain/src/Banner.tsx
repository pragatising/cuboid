import React from "react";
import { Card } from "./Card";
import type { CardProps } from "./Card";

const pick = (tone: "info" | "warn") => tone;

export type BannerProps = CardProps;

/** A card that is a warning unless the caller says otherwise. */
export function Banner(props: BannerProps) {
  return <Card tone={pick("warn")} {...props} />;
}
