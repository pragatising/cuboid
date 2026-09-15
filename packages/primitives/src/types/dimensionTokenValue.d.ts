/**
 * The shape of a dimension token's $value. Verified against all 45 real
 * token files — plain "<number>px"/"<number>rem" is the common case, but
 * real layout tokens also use CSS functions and viewport units directly:
 * "clamp(6.5rem, 25%, 10rem)", "min(90vw, 56rem)", "90vh" (see
 * tokens/functional/size/layout.json). dimensionToRem.ts's px-only filter
 * must pass these through unconverted, not error on them — a dimension
 * transform needs to recognize "not px, leave alone" as a valid case, not
 * a failure.
 *
 * Not yet implemented — stub only.
 */
export type DimensionTokenValue = string; // TODO: px/rem literal, or any valid CSS dimension/function

