import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig } from "style-dictionary/types";
import { isDeprecated } from "../filters/isDeprecated.ts";

/**
 * Deprecated-tokens-only output. Matches Primer's
 * platforms/deprecatedJson.ts. No `$deprecated` authored yet — real
 * infrastructure.
 */
export const deprecatedJson: PlatformInitializer = (outputFile, prefix, buildPath): PlatformConfig => ({
  prefix,
  buildPath,
  transforms: ["name/pathToDotNotation", "json/deprecated"],
  files: [
    {
      destination: outputFile,
      format: "json/flat",
      filter: isDeprecated,
    },
  ],
});
