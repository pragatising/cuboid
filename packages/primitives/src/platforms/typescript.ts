import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig } from "style-dictionary/types";
import { isSource } from "../filters/isSource.ts";

/**
 * ESM output platform — the real consumer seam for ADR-04
 * (docs/adr/adr-04-token-consumption-shape.md): a statically-imported,
 * fully-resolved values object, no CSS var, no React context. Matches
 * Primer's platforms/typescript.ts.
 */
export const typescript: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => ({
  prefix,
  buildPath,
  // As in platforms/json.ts: this platform registers no name transform,
  // so token `name` defaults to the last path segment and collides
  // across unrelated tokens (e.g. "height" from both pill.sizes.height
  // and siteHeader.sizes.height). Harmless here — javascriptEsm.ts's
  // format serializes the full nested tree via jsonToNestedValue, never
  // reading `name` — but under this build's global `warnings: "error"`
  // gate, the collision warning would otherwise be a thrown error.
  log: { warnings: "warn", verbosity: "verbose" },
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
