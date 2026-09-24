import type { Config, PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { isFontFamily } from "../filters/isFontFamily";
import { hasSpaceInString } from "./utilities/hasSpaceInStrings";

/**
 * fontFamily $value -> a Figma-ready string, allowing a per-token
 * override via the platform's `fontFamilies` option (Figma sometimes
 * needs a different family name than CSS, e.g. a licensed font alias).
 * Matches Primer's transformers/fontFamilyToFigma.ts.
 */
export function parseFontFamilyForFigma(token: TransformedToken, fontFamilies: Record<string, string> = {}, options: Config): string {
  const valueProp = options.usesDtcg ? "$value" : "value";
  const record = token as unknown as Record<string, unknown>;

  if (token.name in fontFamilies) {
    return fontFamilies[token.name];
  }
  if (typeof record[valueProp] === "string") {
    return record[valueProp] as string;
  }
  if (Array.isArray(record[valueProp])) {
    return (record[valueProp] as unknown[])
      .map((item) => {
        if (typeof item !== "string") {
          throw new Error(`Invalid value in array ${item}, must be a string`);
        }
        return hasSpaceInString(item) ? `'${item}'` : item;
      })
      .join(", ");
  }
  throw new Error(`Invalid value ${record[valueProp]}, should be a string or array of strings`);
}

export const fontFamilyToFigma: Transform = {
  name: "fontFamily/figma",
  type: "value",
  transitive: true,
  filter: isFontFamily,
  transform: (token: TransformedToken, platform: PlatformConfig, options: Config): string => {
    return parseFontFamilyForFigma(token, platform.options?.fontFamilies as Record<string, string> | undefined, options);
  },
};
