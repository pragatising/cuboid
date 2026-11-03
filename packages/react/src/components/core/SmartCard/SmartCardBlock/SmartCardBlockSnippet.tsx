import React from "react";
import { Text } from "../../Text";
import { useSmartCardContext } from "../SmartCardContext";
import classes from "./SmartCardBlock.module.css";

export type SmartCardBlockSnippetProps = Omit<React.ComponentPropsWithRef<"p">, "color" | "children" | "content"> & {
  /** How many lines of the excerpt show before it is cut off with an ellipsis. @default 3 */
  lines?: number;
};

/** A text excerpt from the linked resource. Nothing is drawn for a link that has none. */
export function SmartCardBlockSnippet({ lines = 3, className, style, ...props }: SmartCardBlockSnippetProps) {
  const { data } = useSmartCardContext("SmartCard.Block.Snippet");
  if (!data?.snippet) return null;
  return (
    <Text
      data-component="SmartCard.Block.Snippet"
      size="sm"
      color="neutral.muted"
      className={[classes.Snippet, className].filter(Boolean).join(" ")}
      style={{ "--smartcard-snippet-lines": lines, ...style } as React.CSSProperties}
      {...props}
    >
      {data.snippet}
    </Text>
  );
}
