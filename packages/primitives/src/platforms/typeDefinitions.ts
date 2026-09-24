import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import { upperCaseFirstCharacter } from "../utilities/upperCaseFirstCharacter.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * Compiled TypeScript type-definitions output. Matches Primer's
 * platforms/typeDefinitions.ts.
 */
export const typeDefinitions: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  preprocessors: ["themeOverrides"],
  transforms: ["color/hex", "shadow/css", "border/css", "dimension/rem", "typography/css", "fontFamily/css", "fontWeight/number"],
  files: [
    {
      format: "typescript/export-definition",
      destination: `${upperCaseFirstCharacter(outputFile)}DesignTokens.d.ts`,
      filter: isSource,
      options: {
        tokenTypesPath: "./src/types/",
        moduleName: `${upperCaseFirstCharacter(outputFile)}DesignTokens`,
        themeOverrides: {
          theme: (options as { theme?: string })?.theme,
        },
      },
    },
  ],
});
