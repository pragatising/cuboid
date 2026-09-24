import type { Transform, TransformedToken } from "style-dictionary/types";
import { isBorder } from "../filters/isBorder";
import type { BorderTokenValue } from "../types/borderTokenValue";
import type { DimensionTokenValue } from "../types/dimensionTokenValue";
import { parseDimension } from "./utilities/parseDimension";
import { normalizeColorValue } from "./utilities/normalizeColorValue";

function dimensionToCss(dim: DimensionTokenValue | string): string {
  if (typeof dim === "string") return dim;
  const { value, unit } = parseDimension(dim);
  if (value === 0) return "0";
  return `${value}${unit}`;
}

function hasBorderProperties(border: Record<string, unknown>): boolean {
  return "color" in border && "width" in border && "style" in border;
}

/**
 * Composite border value ({color, width, style}) -> one CSS border
 * shorthand string. Matches Primer's transformers/borderToCss.ts.
 */
export const borderToCss: Transform = {
  name: "border/css",
  type: "value",
  transitive: true,
  filter: isBorder,
  transform: (token: TransformedToken) => {
    const value = token.$value ?? (token as { value?: unknown }).value;

    if (typeof value === "string") return value;

    if (!hasBorderProperties(value as Record<string, unknown>)) {
      throw new Error(`Invalid border token property ${JSON.stringify(value)}. Must be an object with color, width and style properties.`);
    }

    const border = value as BorderTokenValue;
    const color = typeof border.color === "object" ? normalizeColorValue(border.color) : border.color;
    return `${dimensionToCss(border.width)} ${border.style} ${color}`;
  },
};
