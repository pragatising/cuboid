/**
 * Where an example's card goes: beside the component, or below it. An example is measured once (how wide it is on its own, and
 * whether it fills whatever it is put in), and this decides from those and the room the canvas has.
 */
export type Size = {
  /** How wide the component is when nothing constrains it. */
  natural: number;
  /** It fills its container (a Header, a Table) rather than having a size of its own (a Button): its width means nothing. */
  fluid: boolean;
};

export type Layout = "beside" | "above";

/** The card's width, the line between the component and it, the canvas's margin each side, and the container a fluid component is shown in. */
export const CARD = 600;
export const LINE = 48;
export const MARGIN = 48;
export const CONTAINER = 720;

/**
 * A component with a size of its own goes beside its card when both fit on the canvas; one that fills its container, or is too
 * wide, goes above it. Every row that goes beside shares one left column, as wide as the widest of them, so the lines and the cards
 * stand in two columns.
 */
export function place(sizes: Size[], available: number): { layouts: Layout[]; left: number } {
  const room = available - 2 * MARGIN - LINE - CARD;
  const layouts = sizes.map((size): Layout => (!size.fluid && size.natural <= room ? "beside" : "above"));
  const left = Math.max(0, ...sizes.filter((_, i) => layouts[i] === "beside").map((size) => size.natural));
  return { layouts, left };
}
