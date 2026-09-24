import { toHex } from "color2k";
import type { Transform, TransformedToken } from "style-dictionary/types";
import { isGradient } from "../filters/isGradient.ts";
import { getTokenValue } from "./utilities/getTokenValues.ts";
import { normalizeColorValue, type ColorValue } from "./utilities/normalizeColorValue.ts";

/**
 * Array of color stops -> a CSS linear-gradient() string. Direction
 * comes from the token's `org.cuboid.gradient.angle` extension,
 * defaulting to 180deg. Matches Primer's transformers/gradientToCss.ts
 * (renamed from `org.primer.gradient`).
 */
export const gradientToCss: Transform = {
  name: "gradient/css",
  type: "value",
  transitive: true,
  filter: isGradient,
  transform: (token: TransformedToken) => {
    const angle = (token.$extensions?.["org.cuboid.gradient"] as { angle?: number } | undefined)?.angle;
    const value = getTokenValue(token) as Array<{ color: ColorValue; position: number }>;

    const stops = value.map(({ color, position }) => `${toHex(normalizeColorValue(color))} ${position * 100}%`);

    return `linear-gradient(${angle ?? 180}deg, ${stops.join(", ")})`;
  },
};
