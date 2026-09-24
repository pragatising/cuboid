import Color from "colorjs.io";
import type { ColorW3cValue } from "../../schemas/colorW3cValue";

/**
 * Normalizes any accepted color $value shape to a plain CSS-ready string.
 * String values (hex, rgb, reference) pass through unchanged; W3C DTCG
 * color objects (any color space — sRGB, display-p3, lab, oklch, etc.)
 * are converted to hex via colorjs.io. Matches Primer's
 * transformers/utilities/normalizeColorValue.ts.
 */
export type ColorValue = string | ColorW3cValue;

/**
 * Type guard for the W3C color object shape (as opposed to a bare hex/rgb
 * string). Matches Primer's isW3cColorValue, co-located here since it's a
 * companion of normalizeColorValue rather than a schema-validation concern.
 */
export function isW3cColorValue(value: unknown): value is ColorW3cValue {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.colorSpace !== "string") return false;
  if (!Array.isArray(v.components) || v.components.length !== 3) return false;
  return v.components.every((c) => typeof c === "number" || c === "none");
}

const SPACE_ALIASES: Record<string, string> = {
  "display-p3": "p3",
  "a98-rgb": "a98rgb",
  "prophoto-rgb": "prophoto",
};

function toColorJsSpace(colorSpace: string): string {
  return SPACE_ALIASES[colorSpace] ?? colorSpace;
}

export function w3cToColor(value: ColorW3cValue): Color {
  const coords = value.components.map((c) => (c === "none" ? 0 : c)) as [number, number, number];
  return new Color({
    space: toColorJsSpace(value.colorSpace),
    coords,
    alpha: value.alpha ?? 1,
  });
}

export function normalizeColorValue(value: ColorValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (value.hex && value.colorSpace === "srgb" && (value.alpha === undefined || value.alpha === 1)) {
    return value.hex;
  }

  const color = w3cToColor(value);
  const rgb = color.toGamut("srgb").to("srgb");
  const [r, g, b] = rgb.coords.map((x) => Math.round(Math.max(0, Math.min(1, x ?? 0)) * 255));
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  const alpha = rgb.alpha ?? 1;
  if (alpha < 1) {
    return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
  }
  return hex;
}
