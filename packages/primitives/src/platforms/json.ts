import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * JSON output platform — the shared nested format `defaultTheme.ts`
 * imports and any app compiling its own theme reuses (DESIGN.md §4/Task
 * 4.5). Matches Primer's platforms/json.ts.
 */
export const json: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["themeOverrides"],
  transforms: ["color/hex", "dimension/rem", "shadow/css", "border/css", "typography/css", "fontFamily/css", "fontWeight/number"],
  options: {
    basePxFontSize: 16,
    themeOverrides: {
      theme: (options as { theme?: string })?.theme,
    },
  },
  files: [
    {
      destination: outputFile,
      filter: isSource,
      format: "json/nested-prefixed",
      options: {
        outputReferences: false,
      },
    },
  ],
});
