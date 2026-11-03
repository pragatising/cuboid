import React from "react";
import { Box } from "../../Box";
import { SmartCardBlockActions } from "./SmartCardBlockActions";
import { SmartCardBlockFooter } from "./SmartCardBlockFooter";
import { SmartCardBlockMetadata } from "./SmartCardBlockMetadata";
import { SmartCardBlockPreview } from "./SmartCardBlockPreview";
import { SmartCardBlockSnippet } from "./SmartCardBlockSnippet";
import { SmartCardBlockTitle } from "./SmartCardBlockTitle";

export type SmartCardBlockProps = Omit<React.ComponentPropsWithRef<"div">, "color" | "content">;

/**
 * The link as a card of its own: a bordered frame you fill from the parts (`Title`, `Snippet`, `Metadata`, `Preview`, `Actions`,
 * `Footer`), each reading the link from the card around it and drawing nothing when the link has nothing for it. Without children it holds a
 * Title, Snippet, Metadata, Preview, Actions and Footer.
 */
function SmartCardBlockRoot({ children, ...props }: SmartCardBlockProps) {
  return (
    <Box data-component="SmartCard.Block" border="subtle" borderRadius="md" padding="2x" gap="1x" backgroundColor="canvas.default" {...props}>
      {children ?? (
        <>
          <SmartCardBlockTitle />
          <SmartCardBlockSnippet />
          <SmartCardBlockMetadata />
          <SmartCardBlockPreview />
          <SmartCardBlockActions />
          <SmartCardBlockFooter />
        </>
      )}
    </Box>
  );
}

export const SmartCardBlock = Object.assign(SmartCardBlockRoot, {
  Title: SmartCardBlockTitle,
  Snippet: SmartCardBlockSnippet,
  Metadata: SmartCardBlockMetadata,
  Preview: SmartCardBlockPreview,
  Actions: SmartCardBlockActions,
  Footer: SmartCardBlockFooter,
});
