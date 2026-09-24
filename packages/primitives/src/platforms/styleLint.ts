import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * Full-provenance JSON for a stylelint plugin that flags raw hex/px in
 * app code. Matches Primer's platforms/styleLint.ts.
 */
export const styleLint: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["themeOverrides"],
  transforms: ["name/pathToKebabCase", "color/hex", "dimension/remPxArray", "shadow/css", "border/css", "typography/css", "fontFamily/css", "fontWeight/number"],
  options: {
    basePxFontSize: 16,
    themeOverrides: {
      theme: (options as { theme?: string })?.theme,
    },
  },
  files: [
    {
      destination: outputFile,
      format: "json/one-dimensional",
      filter: isSource,
      options: {
        outputReferences: false,
        outputVerbose: true,
      },
    },
  ],
});
