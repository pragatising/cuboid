import React from "react";
import { SmartCardContext } from "./SmartCardContext";
import { SmartCardBlock, type SmartCardBlockProps } from "./SmartCardBlock";
import { SmartCardEmbed, type SmartCardEmbedProps } from "./SmartCardEmbed";
import { SmartCardInline, type SmartCardInlineProps } from "./SmartCardInline";
import { SmartCardProvider } from "./SmartCardProvider";
import { useSmartLink } from "./useSmartLink";

export type SmartCardProps = {
  /** The link to show. */
  url: string;
  /** How the link is shown: `inline` in a line of text, `block` as a card, or `embed` as a frame of its content. @default "embed" */
  appearance?: "inline" | "block" | "embed";
  /** Props for the appearance, when it is chosen by `appearance`. */
  inline?: SmartCardInlineProps;
  block?: SmartCardBlockProps;
  embed?: SmartCardEmbedProps;
  /** Compose the card from its parts instead of choosing an `appearance`. */
  children?: React.ReactNode;
};

/**
 * One URL, resolved once, shown in the appearance you pick. Parts (`SmartCard.Inline`, `SmartCard.Block`, `SmartCard.Embed`) read the link from the card around them,
 * so they take no data of their own; give them as `children` to compose, or pick an `appearance`.
 */
function SmartCardRoot({ url, appearance = "embed", inline, block, embed, children }: SmartCardProps) {
  const link = useSmartLink(url);
  return (
    <SmartCardContext.Provider value={{ ...link, url }}>
      {children ??
        (appearance === "inline" ? <SmartCardInline {...inline} /> : appearance === "block" ? <SmartCardBlock {...block} /> : <SmartCardEmbed {...embed} />)}
    </SmartCardContext.Provider>
  );
}

export const SmartCard = Object.assign(SmartCardRoot, { Provider: SmartCardProvider, Inline: SmartCardInline, Block: SmartCardBlock, Embed: SmartCardEmbed });
