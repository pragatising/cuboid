import type { Transform, TransformedToken } from "style-dictionary/types";
import { isFontWeight } from "../filters/isFontWeight.ts";
import { getTokenValue } from "./utilities/getTokenValues.ts";

/**
 * Named fontWeight strings mapped to their numeric equivalent. Matches
 * Primer's transformers/fontWeightToNumber.ts.
 */
const FONT_WEIGHT_NAMES: Record<string, string[]> = {
  "100": ["thin", "hairline"],
  "200": ["extra-light", "ultra-light"],
  "300": ["light"],
  "400": ["normal", "regular", "book"],
  "500": ["medium"],
  "600": ["semi-bold", "demi-bold"],
  "700": ["bold"],
  "800": ["extra-bold", "ultra-bold"],
  "900": ["black", "heavy"],
  "950": ["extra-black", "ultra-black"],
};

export function parseFontWeight(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`Invalid value ${value}, should be a number or fontWeight string`);
  }

  let numericValue: number | undefined = typeof value === "number" ? value : undefined;

  if (typeof value === "string") {
    const key = Object.keys(FONT_WEIGHT_NAMES).find((k) => FONT_WEIGHT_NAMES[k].includes(value));
    if (key !== undefined) {
      return parseInt(key, 10);
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      numericValue = parsed;
    }
  }

  if (numericValue !== undefined && numericValue > 0 && numericValue <= 1000) {
    return numericValue;
  }

  throw new Error(`Invalid value ${value}, should be a number or fontWeight string`);
}

export const fontWeightToNumber: Transform = {
  name: "fontWeight/number",
  type: "value",
  transitive: true,
  filter: isFontWeight,
  transform: (token: TransformedToken): number => parseFontWeight(getTokenValue(token)),
};
