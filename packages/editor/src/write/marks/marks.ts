import { Mark as EngineMark, mergeAttributes } from "@tiptap/core";
import { highlightVars, isHighlightName, isTextColor, textColorVar } from "../../utils/palette";

/**
 * Text colour: a mark whose one attribute is a name from the palette (`danger.strong`). A name that is not in the palette is read as
 * no colour, so a stored document cannot put an arbitrary style on the page.
 */
export const TextColor = EngineMark.create({
  name: "textColor",
  addAttributes: () => ({ color: { default: null } }),
  parseHTML: () => [{ tag: "span[data-text-color]", getAttrs: (el) => (isTextColor((el as HTMLElement).dataset.textColor) ? { color: (el as HTMLElement).dataset.textColor } : false) }],
  renderHTML: ({ mark, HTMLAttributes }) =>
    isTextColor(mark.attrs.color)
      ? ["span", mergeAttributes(HTMLAttributes, { "data-text-color": mark.attrs.color, style: `color:${textColorVar(mark.attrs.color)};--editor-chip-color:${textColorVar(mark.attrs.color)}` }), 0]
      : ["span", 0],
});

/** A highlighted run of text: a mark whose one attribute is the name of one of Cuboid's highlight colours. */
export const HighlightMark = EngineMark.create({
  name: "highlight",
  addAttributes: () => ({ color: { default: "yellow" } }),
  parseHTML: () => [{ tag: "mark[data-highlight]", getAttrs: (el) => (isHighlightName((el as HTMLElement).dataset.highlight) ? { color: (el as HTMLElement).dataset.highlight } : false) }],
  renderHTML: ({ mark, HTMLAttributes }) => {
    const color = isHighlightName(mark.attrs.color) ? mark.attrs.color : "yellow";
    const { background, color: ink } = highlightVars(color);
    return ["mark", mergeAttributes(HTMLAttributes, { "data-highlight": color, style: `background:${background};color:${ink}` }), 0];
  },
});

/**
 * A chip: a run of text set on a quiet grey ground, as tall as its line so the paragraph does not move. It is a mark on the text, not a
 * node: the text inside is still text, and can be bold, coloured or linked. Typing after it does not continue it.
 */
export const Chip = EngineMark.create({
  name: "chip",
  inclusive: false,
  parseHTML: () => [{ tag: "span[data-chip]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-chip": "" }), 0],
  addKeyboardShortcuts() {
    return { "Mod-e": () => this.editor.commands.toggleMark(this.name) };
  },
});
