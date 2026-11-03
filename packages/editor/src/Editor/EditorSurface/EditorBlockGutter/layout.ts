/**
 * The first line of text in a block: the first non-blank text node, or a textarea. Decorative parts (an icon's ligature, an embed's click-to-load label)
 * are not text the block shows, so they are passed over: an image's toolbar icons are words to the browser ("notes", "download") and must not
 * be taken for its first line.
 */
export function firstTextNode(container: HTMLElement): Text | HTMLTextAreaElement | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (node instanceof Element && (node.hasAttribute("data-editor-gutter-skip") || node.getAttribute("aria-hidden") === "true")) return NodeFilter.FILTER_REJECT;
      if (node instanceof HTMLTextAreaElement) return NodeFilter.FILTER_ACCEPT;
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    },
  });
  return walker.nextNode() as Text | HTMLTextAreaElement | null;
}

/**
 * Viewport y of the centre of the first line of text in a block. Null when the block shows no text, or the environment cannot measure it (no
 * layout), and the caller falls back to the block's top.
 */
export function firstLineCenterY(container: HTMLElement): number | null {
  const node = firstTextNode(container);
  if (!node) return null;

  if (node instanceof HTMLTextAreaElement) {
    const style = getComputedStyle(node);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    return node.getBoundingClientRect().top + parseFloat(style.paddingTop) + lineHeight / 2;
  }

  const range = document.createRange();
  range.selectNodeContents(node);
  const first = range.getClientRects()[0];
  return first && first.height > 0 ? first.top + first.height / 2 : null;
}

/** How long a pointer must rest on the block being typed in before its gutter appears, so passing over it mid-sentence does not flash it. */
export const GUTTER_HOLD_MS = 300;
/** How long the gutter lingers after the pointer leaves, so the pointer can cross the gap to it. */
export const GUTTER_HIDE_MS = 250;
/** How far left of the text the pointer still counts as being on a block, in px (the portfolio's hit extension): the gutter is reached from beside the block, at any height. */
export const GUTTER_REACH = 120;
