import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { smartLinkUrl } from "../../blocks/smartLink/smartLinkUrl";

/** The address a paste stands for: one URL on its own, or the `src` of pasted `<iframe>` code. Anything else is text, and stays text. */
export function pastedLinkUrl(text: string): string | null {
  const typed = text.trim();
  const iframe = /^<iframe\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/i.exec(typed);
  if (iframe) {
    const src = (iframe[1] ?? iframe[2]).trim();
    return /^[a-z][a-z0-9+.-]*:/i.test(src) ? smartLinkUrl(src) : null;
  }
  // A bare address only counts with its scheme: pasting `e.g.` or `file.txt` is not asking for a card.
  if (/^https?:\/\//i.test(typed)) return smartLinkUrl(typed);
  return null;
}

/**
 * Pasting a link into an empty paragraph makes it a link block (a card or an embedded frame), as pasting into text makes text. Pasting `<iframe>`
 * code does the same with its `src`. Only where the page has a `smartLink` block, and only on an empty line: a link pasted into a sentence is a link
 * in that sentence, which the engine already does.
 */
export const PasteLink = Extension.create({
  name: "pasteLink",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pasteLink"),
        props: {
          handlePaste: (view, event) => {
            const type = view.state.schema.nodes.smartLink;
            const data = event.clipboardData;
            if (!type || !data) return false;
            const { selection } = view.state;
            const { $from } = selection;
            if (!selection.empty || $from.parent.type.name !== "paragraph" || $from.parent.content.size !== 0) return false;
            const url = pastedLinkUrl(data.getData("text/plain"));
            if (!url) return false;
            const node = type.createAndFill({ url });
            if (!node) return false;
            // The empty paragraph is replaced, not left above the block.
            view.dispatch(view.state.tr.replaceRangeWith($from.before(), $from.after(), node).scrollIntoView());
            return true;
          },
        },
      }),
    ];
  },
});
