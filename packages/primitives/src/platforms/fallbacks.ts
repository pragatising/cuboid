import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * Old-name -> new-CSS-var fallback map, for a deprecated-token migration
 * period. Matches Primer's platforms/fallbacks.ts.
 */
export const fallbacks: PlatformInitializer = (outputFile, prefix, buildPath): PlatformConfig => ({
  prefix,
  buildPath,
  transforms: ["name/pathToKebabCase", "color/hex", "dimension/rem", "shadow/css", "border/css", "typography/css", "fontFamily/css", "fontWeight/number"],
  options: {
    basePxFontSize: 16,
  },
  files: [
    {
      destination: outputFile,
      format: "json/postCss-fallback",
      filter: isSource,
      options: {
        outputReferences: false,
        outputVerbose: true,
      },
    },
  ],
});
