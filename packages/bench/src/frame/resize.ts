/** The eight places a frame can be taken by: its four edges and four corners, named by compass point. */
export const HANDLES = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export type Handle = (typeof HANDLES)[number];

/** Where a frame is and how big: its size, and how far it has been moved from where it sits. */
export type Box = { width: number; height: number; x: number; y: number };

export const MIN_WIDTH = 240;
export const MAX_WIDTH = 4000;
export const MIN_HEIGHT = 80;
export const MAX_HEIGHT = 4000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/**
 * The frame after a handle is dragged by (`dx`, `dy`), from the box it was in when the drag began. An east or south side moves out, a west or
 * north side moves in the same direction as the pointer; so the opposite side stays where it is, the frame's offset follows (a frame is laid out
 * from its top left, so a west or north drag must also move it). A size stops at its limits and the frame stops with it, not past them.
 */
export function resizeBox(start: Box, handle: Handle, dx: number, dy: number): Box {
  let { width, height, x, y } = start;
  if (handle.includes("e")) width = clamp(start.width + dx, MIN_WIDTH, MAX_WIDTH);
  if (handle.includes("w")) {
    width = clamp(start.width - dx, MIN_WIDTH, MAX_WIDTH);
    x = start.x + (start.width - width);
  }
  if (handle.includes("s")) height = clamp(start.height + dy, MIN_HEIGHT, MAX_HEIGHT);
  if (handle.includes("n")) {
    height = clamp(start.height - dy, MIN_HEIGHT, MAX_HEIGHT);
    y = start.y + (start.height - height);
  }
  return { width, height, x, y };
}

/** The keys that move a side: an arrow in the side's own direction grows the frame, the opposite shrinks it. Returns the drag it stands for. */
export function keyDrag(handle: Handle, key: string, by: number): { dx: number; dy: number } | null {
  const horizontal = handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0;
  const vertical = handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0;
  if (horizontal && key === "ArrowRight") return { dx: by, dy: 0 };
  if (horizontal && key === "ArrowLeft") return { dx: -by, dy: 0 };
  if (vertical && key === "ArrowDown") return { dx: 0, dy: by };
  if (vertical && key === "ArrowUp") return { dx: 0, dy: -by };
  return null;
}
