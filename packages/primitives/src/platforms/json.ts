import type { PlatformInitializer } from "../types/platformInitializer";
import { isSource } from "../filters/isSource.ts";
import type { PlatformConfig } from "style-dictionary/types";

/**
 * JSON output platform — the shared nested format `defaultTheme.ts`
 * imports and any app compiling its own theme reuses (DESIGN.md §4/Task
 * 4.5). Matches Primer's platforms/json.ts.
 */
export const json: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  // As in platforms/css.ts, the build sets log.warnings: "error" globally so
  // a transform error fails the build. This platform downgrades that to
  // "warn" for one expected, harmless case: token-name COLLISIONS.
  //
  // This platform deliberately registers no name transform (matching
  // Primer's json.ts), so every token's `name` defaults to its last path
  // segment — `size.0` and `display.gray.scale.0` are both named "0".
  // Style Dictionary reports that as a collision, but the
  // `json/nested-prefixed` format never reads `name`: it serializes
  // `dictionary.tokens`, the nested tree, so both tokens land at their own
  // distinct paths (tokens.size["0"], tokens.display.gray.scale["0"]).
  // Verified in the emitted tokens.json.
  //
  // A name transform would silence the warning but is the wrong fix — it
  // would add flat names this format never uses. Keep it scoped here so
  // transform errors stay fatal everywhere else.
  log: { warnings: "warn", verbosity: "verbose" },
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
