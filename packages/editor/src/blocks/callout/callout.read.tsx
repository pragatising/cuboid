import { Callout } from "@sragatiping/cuboid";
import type { CSSProperties } from "react";
import { defineReadBlock } from "../../core";
import { HIGHLIGHT_NAMES, highlightVars, isHighlightName } from "../../utils/palette";

/** A callout's colour is one of Cuboid's highlight colours, or `neutral`; it may have a border. */
export type CalloutAttrs = { color: (typeof HIGHLIGHT_NAMES)[number]; bordered: boolean };

/** The surface a callout draws: the highlight's own background, and a hairline when it has a border. A colour the document names that does not exist is neutral. */
export function calloutStyle(color: unknown, bordered: unknown): CSSProperties {
  const name = isHighlightName(color) ? color : "neutral";
  return {
    background: highlightVars(name).background,
    ...(bordered ? { border: "1px solid var(--cube-borderColor-default)" } : {}),
  };
}

export const calloutRead = defineReadBlock<CalloutAttrs>({
  name: "callout",
  attrs: { color: { default: "neutral" }, bordered: { default: false } },
  Read: ({ attrs, children }) => <Callout data-prose-flow="" style={calloutStyle(attrs.color, attrs.bordered)}>{children}</Callout>,
});
