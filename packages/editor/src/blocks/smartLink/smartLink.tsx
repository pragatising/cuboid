import { defineBlock } from "../../core";
import { SmartLinkToolbar } from "./SmartLinkToolbar";
import { SmartLinkSettings } from "./SmartLinkSettings";
import { SmartLinkUrlField } from "./SmartLinkUrlField";
import { smartLinkRead } from "./smartLink.read";

const View = smartLinkRead.Read;

/** A link shown as a link, a card or an embedded frame. Empty, it asks for the address; with one, it is what a reader sees, and its gutter menu opens the settings. */
export const smartLink = defineBlock(smartLinkRead, {
  holds: "nothing",
  menu: { label: "Link", group: "media", keywords: ["embed", "url", "smart link", "bookmark", "iframe", "figma", "storybook"] },
  settings: { label: "Link settings", icon: "link", Panel: SmartLinkSettings },
  Write: ({ attrs, update, selected }) =>
    attrs.url ? (
      <>
        <View attrs={attrs} text="">{null}</View>
        {selected ? <SmartLinkToolbar attrs={attrs} update={update} /> : null}
      </>
    ) : (
      <SmartLinkUrlField onSubmit={(url) => update({ url })} />
    ),
});
