/**
 * The shape of a color token's $value: a hex string ("#FFFFFF"), or a
 * {path.to.token} reference string, resolved before this type ever applies.
 * Matches Primer's colorHex.d.ts scope, minus the W3C color-space object
 * variant (cuboid's tokens are hex-only today — see tokens/base/light.json).
 *
 * Not yet implemented — stub only.
 */
export type ColorTokenValue = string; // TODO: hex string | {path} reference
