import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig } from "style-dictionary/types";
import { isSource } from "../filters/isSource";

/**
 * ESM output platform. Matches Primer's platforms/typescript.ts. Not
 * what defaultTheme.ts uses (that's the json platform's
 * jsonNestedPrefixed) — built for a consumer that specifically wants a
 * real module.
 */
export const typescript: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["themeOverrides"],
  transforms: ["color/hex", "dimension/rem", "shadow/css", "border/css", "typography/css", "fontFamily/css", "fontWeight/number"],
  options: {
    showFileHeader: false,
    basePxFontSize: 16,
    themeOverrides: {
      theme: (options as { theme?: string })?.theme,
    },
  },
  files: [
    {
      format: "javascript/esm",
      destination: outputFile,
      filter: isSource,
    },
  ],
});
