import type { SizeScale, Tokens } from "../mode";

/**
 * A spacing value: the Nx scale (`"1.5x"` = 12px, 1x = 8px — see `SizeScale`) or the semantic
 * ladder (`"xxs"` … `"xxl"` — `tokens.space`). Both resolve to a rem string from the tokens.
 */
export type Space = SizeScale | keyof Tokens["space"];

/** Resolve a `Space` to its CSS length. Throws on a value the types would have rejected. */
export function resolveSpace(tokens: Pick<Tokens, "space" | "size">, value: Space): string {
  if (value in tokens.space) return tokens.space[value as keyof Tokens["space"]];

  // "1.5x" -> px key "12" (the size tokens are keyed by px; Nx exists only in the typed API).
  // Every Nx step is a whole number of px and an exact binary fraction, so no rounding: "0.3x"
  // (2.4px) must fail, not quietly become the 2px token.
  const px = parseFloat(value) * 8;
  const size = Number.isInteger(px) ? (tokens.size as unknown as Record<string, unknown>)[String(px)] : undefined;
  if (typeof size !== "string") throw new Error(`Unknown spacing value "${value}".`);
  return size;
}
