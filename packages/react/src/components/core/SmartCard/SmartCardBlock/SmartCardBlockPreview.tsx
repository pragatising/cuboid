import React from "react";
import { Box } from "../../Box";
import { linkBase, parseLinkUrl } from "../linkUrl";
import { useSmartCardContext } from "../SmartCardContext";
import classes from "./SmartCardBlock.module.css";

export type SmartCardBlockPreviewProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "children" | "content"> & {
  /** The shape of the picture, as a CSS `aspect-ratio`. @default "16 / 9" */
  aspectRatio?: string;
};

/** A picture of the linked resource. Nothing is drawn for a link with none, or whose picture is not an http(s) URL. */
export function SmartCardBlockPreview({ aspectRatio = "16 / 9", ...props }: SmartCardBlockPreviewProps) {
  const { data } = useSmartCardContext("SmartCard.Block.Preview");
  const src = data?.preview ? parseLinkUrl(data.preview, linkBase())?.href : undefined;
  if (!src) return null;
  return (
    <Box data-component="SmartCard.Block.Preview" borderRadius="sm" overflow="hidden" {...props}>
      {/* Decorative: the title names the link, and the picture only shows what it is like. */}
      <img className={classes.Preview} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ aspectRatio }} />
    </Box>
  );
}
