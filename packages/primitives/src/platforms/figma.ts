import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import type { TransformedToken, PlatformConfig, Config } from "style-dictionary/types";

/**
 * True if a token is eligible for Figma variable export: a real source
 * token, not an em-relative value (can't be a fixed Figma variable), and
 * carries an `org.cuboid.figma.collection` (renamed from Primer's
 * `org.primer.figma`). Matches Primer's platforms/figma.ts.
 */
async function validFigmaToken(token: TransformedToken, options: Config): Promise<boolean> {
  const valueProp = options.usesDtcg ? "$value" : "value";
  const validTypes = ["color", "dimension", "shadow", "fontWeight", "fontFamily", "number"];
  const record = token as unknown as Record<string, unknown>;

  if (!isSource(token) || !token.$type) return false;

  const value = record[valueProp];
  if (typeof value === "string" && value.substring(value.length - 2) === "em") return false;

  if (!("$extensions" in token) || !token.$extensions || !("org.cuboid.figma" in token.$extensions) || !("collection" in (token.$extensions["org.cuboid.figma"] as object))) {
    return false;
  }

  return validTypes.includes(token.$type);
}

/**
 * Figma Variables JSON output platform — feeds the Figma-sync work
 * (DESIGN.md §6). Matches Primer's platforms/figma.ts.
 */
export const figma: PlatformInitializer = (outputFile, prefix, buildPath, options: { theme?: [string | undefined, string | undefined] } & Record<string, unknown> = {}): PlatformConfig => {
  const { theme } = options;
  const figmaTheme = (theme?.[0] || "").replaceAll("-", " ");

  return {
    prefix,
    buildPath,
    preprocessors: ["themeOverrides"],
    transforms: ["color/rgbaFloat", "fontFamily/figma", "float/pixelUnitless", "dimension/pixelUnitless", "fontWeight/number", "figma/attributes", "name/pathToFigma"],
    options: {
      basePxFontSize: 16,
      fontFamilies: {
        system: "SF Pro Text",
        sansSerif: "SF Pro Text",
        sansSerifDisplay: "SF Pro Display",
        monospace: "SF Mono",
      },
      ...options,
      theme: figmaTheme,
      themeOverrides: {
        theme: options.theme,
      },
    },
    files: [
      {
        destination: outputFile,
        filter: (token: TransformedToken, config: Config) => validFigmaToken(token, config),
        format: "json/figma",
        options: {
          outputReferences: true,
          theme: figmaTheme,
        },
      },
    ],
  };
};
