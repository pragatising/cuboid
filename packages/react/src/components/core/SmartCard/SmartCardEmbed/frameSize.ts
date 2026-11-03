/**
 * How an embedded frame is sized. `auto` measures the content (same-origin only);
 * `sm|md|lg` are fixed pixel heights; the ratios scale with the width, which is
 * what design frames and prototypes want.
 */
export const EMBED_HEIGHTS = ["auto", "sm", "md", "lg", "16:9", "4:3"] as const;

export type EmbedHeight = (typeof EMBED_HEIGHTS)[number];

/** A pixel height, or a width-relative aspect ratio. */
export type EmbedFrameSize = { heightPx: number } | { aspectRatio: string };

const FRAME_SIZES: Record<Exclude<EmbedHeight, "auto">, EmbedFrameSize> = {
  sm: { heightPx: 320 },
  md: { heightPx: 480 },
  lg: { heightPx: 720 },
  "16:9": { aspectRatio: "16 / 9" },
  "4:3": { aspectRatio: "4 / 3" },
};

/** Floor for every frame, so tiny content (a 404) does not collapse it. */
export const EMBED_MIN_HEIGHT_PX = 200;

/** Height `auto` uses before the content is measured. */
export const EMBED_AUTO_INITIAL_HEIGHT_PX = 480;

/**
 * Ceiling for a measured `auto` height. Content sized off the viewport (`min-height: 100vh`) grows with the frame,
 * so measuring it would otherwise feed back into an ever-taller frame.
 */
export const EMBED_AUTO_MAX_HEIGHT_PX = 1600;

export function embedFrameSize(height: Exclude<EmbedHeight, "auto">): EmbedFrameSize {
  return FRAME_SIZES[height];
}

/**
 * The preset in effect. An explicit choice wins, except `auto` where the content cannot be measured (cross-origin).
 * Unset: fit the content when it can be measured, else medium.
 */
export function resolveEmbedHeight(value: EmbedHeight | undefined, sameOrigin: boolean): EmbedHeight {
  if (value && (value !== "auto" || sameOrigin)) return value;
  return sameOrigin ? "auto" : "md";
}
