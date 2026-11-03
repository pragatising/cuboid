import type { Issue } from "./issue";

/** Elements that are something to see or use without any text in them. */
const SELF_CONTAINED = "img, svg, canvas, video, audio, picture, iframe, input, textarea, select, button, hr, progress, meter, [role='img'], [role='separator'], [role='progressbar']";

/** Whether a drawn example shows anything: text, an image, a line, a control. A box with nothing in it shows nothing. */
export const drawsSomething = (element: Element) => (element.textContent ?? "").trim() !== "" || element.querySelector(SELF_CONTAINED) !== null;

/**
 * A component whose content is only optional props, drawn with none of them set. If it shows nothing, then `<EmptyState />` is valid
 * code that draws an empty box: the types allow what no one could mean, so the component should require something. `from` are the
 * optional props its content comes from (see `contentFromOptional`); `element` is the example drawn with none of them set.
 */
export function drawsNothing(element: Element, component: string, from: string[], path: string[]): Issue[] {
  if (from.length === 0 || drawsSomething(element)) return [];
  const names = from.length === 1 ? from[0] : `${from.slice(0, -1).join(", ")} or ${from[from.length - 1]}`;
  return [
    {
      rule: "system.draws-nothing",
      severity: "warning",
      source: "system",
      message: `<${component} /> draws nothing: with none of ${names} set there is no text, image or control, and every one is optional. The types allow what no one could mean; require at least one.`,
      path,
      references: [],
    },
  ];
}
