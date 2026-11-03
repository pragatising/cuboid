import { Callout } from "@sragatiping/cuboid";
import { defineBlock } from "../../core";
import { CALLOUT_CONTENT } from "../../constants";
import { CalloutSettings } from "./CalloutSettings";
import { calloutRead, calloutStyle } from "./callout.read";

/** A callout holds blocks (paragraphs, lists, code, an image), though never another callout or a column layout. */
export const callout = defineBlock(calloutRead, {
  holds: "blocks",
  accepts: CALLOUT_CONTENT,
  groups: ["columnBlock"],
  menu: { label: "Callout", group: "basic", keywords: ["note", "aside"] },
  settings: { label: "Callout color & border", icon: "palette", Panel: CalloutSettings },
  Write: ({ attrs, children }) => <Callout style={calloutStyle(attrs.color, attrs.bordered)}>{children}</Callout>,
});
