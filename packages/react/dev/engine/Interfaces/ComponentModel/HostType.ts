/**
 * What a host element is: the tag the source wrote (`button`, `a`, `input`, `svg`). The source says only the tag; that it is an
 * HTML or an SVG element is worked out from the tag and where it sits.
 */
export type HostType = {
  tag: string;
};
