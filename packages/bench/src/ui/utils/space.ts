import type { SizeScale, Tokens } from "../mode";

/**
 * A spacing value: the Nx scale (`"1.5x"` = 12px, 1x = 8px — see `SizeScale`) or the semantic
 * ladder (`"xxs"` … `"xxl"` — `tokens.space`). Both resolve to a rem string from the tokens.
 */
export type Space = SizeScale | keyof Tokens["space"];

/** The units a raw CSS length may carry. */
type CssUnit = "px" | "rem" | "em" | "%" | "vh" | "vw" | "svh" | "dvh" | "lvh" | "vmin" | "vmax" | "ch" | "ex";

/**
 * A CSS length written as is: a number with a unit (`"12px"`, `"0.75rem"`, `"-4px"`) or a CSS function
 * (`"calc(100% - 2rem)"`, `"var(--gutter)"`, `"min(…)"`, `"max(…)"`, `"clamp(…)"`). The escape hatch for a value that
 * is not a design decision, or not one the scale has. A typo (`"huge"`, `"12"`) is a type error, not silently ignored.
 */
export type RawLength =
  | `${number}${CssUnit}`
  | `calc(${string})`
  | `var(${string})`
  | `min(${string})`
  | `max(${string})`
  | `clamp(${string})`
  // The CSS multi-value shorthand (`padding="8px 16px"`, `borderRadius="0 0 8px 8px"`): two to four plain lengths.
  | `${number}${CssUnit} ${string}`
  | `0 ${string}`;

const LENGTH_PART = "-?(?:\\d+\\.?\\d*|\\.\\d+)(?:px|rem|em|%|vh|vw|svh|dvh|lvh|vmin|vmax|ch|ex)";
const PLAIN = `(?:${LENGTH_PART}|0|auto)`;
const RAW_LENGTH = new RegExp(
  `^(?:${LENGTH_PART}|0)$|^(?:calc|var|min|max|clamp)\\(.+\\)$|^${PLAIN}(?: ${PLAIN}){1,3}$`,
);

/**
 * A length: a step of the Nx scale (`"20x"` = 160px), or any CSS length or keyword, passed through as written
 * (`"100%"`, `"auto"`, `"fit-content"`, `"min(90vw, 56rem)"`). The scale is for values that are design decisions;
 * the pass-through is for the ones that are not (a percentage has no token).
 */
export type Length = SizeScale | (string & {});

/** "1.5x", "20x": the shape of an Nx scale key. Nothing else in CSS looks like this, so it can never be a raw value. */
const SCALE_KEY = /^\d+(\.\d+)?x$/;

/** One step of the Nx scale -> its CSS length. Throws on a value that is not a step (`"0.3x"`). */
function scaleStep(tokens: Pick<Tokens, "size">, value: string): string {
  // "1.5x" -> px key "12" (the size tokens are keyed by px; Nx exists only in the typed API).
  // Every Nx step is a whole number of px and an exact binary fraction, so no rounding: "0.3x"
  // (2.4px) must fail, not quietly become the 2px token.
  const px = parseFloat(value) * 8;
  const size = Number.isInteger(px) ? (tokens.size as unknown as Record<string, unknown>)[String(px)] : undefined;
  if (typeof size !== "string") throw new Error(`Unknown spacing value "${value}".`);
  return size;
}

/** Resolve a `Space` to its CSS length. Throws on a value the types would have rejected. */
export function resolveSpace(tokens: Pick<Tokens, "space" | "size">, value: Space): string {
  if (value in tokens.space) return tokens.space[value as keyof Tokens["space"]];
  return scaleStep(tokens, value);
}

/** Resolve a `Length`: an Nx step becomes its token, anything else is returned as written. */
export function resolveSize(tokens: Pick<Tokens, "size">, value: Length): string {
  return SCALE_KEY.test(value) ? scaleStep(tokens, value) : value;
}

/** A spacing prop's value: a token (the Nx scale or the semantic ladder), `0`, or a raw CSS length (`"12px"`, `"calc(…)"`, `"8px 16px"`). */
export type SpaceValue = Space | RawLength | 0;

/** Resolve a `SpaceValue`: a token becomes its length, `0` is `"0"`, a raw length is returned as written. Throws on anything else. */
export function resolveSpaceValue(tokens: Pick<Tokens, "space" | "size">, value: SpaceValue): string {
  if (value === 0) return "0";
  if (value in tokens.space || SCALE_KEY.test(value)) return resolveSpace(tokens, value as Space);
  if (RAW_LENGTH.test(value)) return value;
  throw new Error(`Unknown spacing value "${value}".`);
}
