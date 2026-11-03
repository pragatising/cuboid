import { Callout, Text } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/**
 * A block from the portfolio's old editor that has no counterpart here yet (an image, an embed, a table…). It keeps the old block whole in its
 * attributes, so nothing is lost by migrating and a later step can turn it into the real block; until then it says what it is.
 */
export type LegacyAttrs = { tag: string; variant: string | null; props: Record<string, string>; children: string };

export const legacyRead = defineReadBlock<LegacyAttrs>({
  name: "legacy",
  attrs: { tag: { default: "" }, variant: { default: null }, props: { default: {} }, children: { default: "" } },
  Read: ({ attrs }) => (
    <Callout backgroundColor="warning.subtle" data-prose-flow="" data-legacy-tag={attrs.tag}>
      <Text size="sm">{`A “${attrs.tag}” block from the old editor, not yet migrated.`}</Text>
    </Callout>
  ),
});
