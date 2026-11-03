import { SmartCard, type EmbedHeight } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/** How the link is shown: in a line (`inline`), as a card (`block`), or as the page itself in a frame (`embed`). */
export const SMART_LINK_APPEARANCES = [
  { value: "inline", label: "Inline" },
  { value: "block", label: "Card" },
  { value: "embed", label: "Embed" },
] as const;

/** How tall an embed's frame is: the presets Cuboid's `SmartCard.Embed` knows. An empty height lets the frame choose (fit the content where it can be measured). */
export const SMART_LINK_HEIGHTS = [
  { value: "", label: "Automatic" },
  { value: "auto", label: "Fit content" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "4:3", label: "Standard (4:3)" },
] as const;

export type SmartLinkAttrs = {
  url: string;
  appearance: (typeof SMART_LINK_APPEARANCES)[number]["value"];
  height: (typeof SMART_LINK_HEIGHTS)[number]["value"];
};

/** A link to show: the address, how it is drawn, and how tall an embed is. What the link is (its title, icon, preview) comes from the host's resolver, not from the document. */
export const smartLinkRead = defineReadBlock<SmartLinkAttrs>({
  name: "smartLink",
  attrs: { url: { default: "" }, appearance: { default: "embed" }, height: { default: "" } },
  // Cuboid's `SmartCard` in the appearance the block names. The writer sees the same once there is an address.
  Read: ({ attrs }) => (attrs.url ? <SmartCard url={attrs.url} appearance={attrs.appearance} embed={{ height: (attrs.height || undefined) as EmbedHeight | undefined }} /> : null),
});
