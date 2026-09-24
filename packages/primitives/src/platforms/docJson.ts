import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * Full-provenance JSON for docs/tooling consumers. Matches Primer's
 * platforms/docJson.ts.
 */
export const docJson: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["themeOverrides"],
  transforms: ["name/pathToKebabCase", "color/hex", "dimension/rem", "shadow/css", "border/css", "typography/css", "fontFamily/css", "fontWeight/number"],
  options: {
    basePxFontSize: 16,
    propertyConversion: {
      $value: "value",
      $type: "type",
      $description: "description",
    },
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
