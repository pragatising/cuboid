import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig } from "style-dictionary/types";
import { isSource } from "../filters/isSource";

/**
 * CommonJS output platform. Matches Primer's platforms/javascript.ts.
 * No current consumer (packages/react is ESM) — real infrastructure.
 */
export const javascript: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
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
      format: "javascript/commonJs",
      destination: outputFile,
      filter: isSource,
    },
  ],
});
