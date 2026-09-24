import { rgba, parseToRgba } from "color2k";
import type { PlatformConfig, TransformedToken } from "style-dictionary/types";
import { log } from "../../utilities/log.ts";

/**
 * Applies a desired alpha value to a color string (hex, rgb, etc.),
 * returning an rgba() string. Warns (doesn't fail) if the source color
 * already had its own alpha — that value is discarded in favor of the
 * requested one. Matches Primer's transformers/utilities/alpha.ts.
 */
export function alpha(color: string, desiredAlpha: number, token?: TransformedToken, config?: PlatformConfig): string {
  const [r, g, b, a] = parseToRgba(color);

  if (a < 1 && desiredAlpha < 1) {
    log.info(
      `You are setting an alpha value of "${desiredAlpha}" for a color with an alpha value (${color}). The previous alpha value will be disregarded as if the color would have been 100% opaque.${
        token !== undefined ? `\n ↳ Token: "${token.name}" in file: "${token.filePath}"` : ""
      }`,
      config,
    );
  }

  return rgba(r, g, b, desiredAlpha);
}
