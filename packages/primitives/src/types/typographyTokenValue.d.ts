/**
 * Shapes for cuboid's raw typography leaves: fontFamily is a string or
 * string array; fontWeight and lineHeight are unitless numbers (see
 * tokens/functional/typography/typography.json — weight: 400/500/600,
 * lineHeight: 16/20/24). Matches Primer's typographyTokenValue.d.ts scope,
 * minus the composite typography-shorthand type Primer also has, since
 * cuboid's typography.json stores each property as its own leaf, not a
 * composite object.
 *
 * Not yet implemented — stub only.
 */
export type FontFamilyTokenValue = unknown; // TODO: string | string[]
export type FontWeightTokenValue = number; // TODO
export type LineHeightTokenValue = number; // TODO
