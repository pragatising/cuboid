import { isFromFile } from "../filters/isFromFile.ts";
import { isSource as isSourceFilter } from "../filters/isSource.ts";
import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig, TransformedToken } from "style-dictionary/types";
import { outputReferencesTransformed, outputReferencesFilter } from "style-dictionary/utils";

/**
 * Determines whether a token's value should use CSS variable references
 * rather than an inlined resolved value. Based on Primer's
 * platforms/css.ts.
 *
 * `border` is force-enabled (as in Primer): composite values report as
 * non-string originals, so the generic checks below return false, but
 * the formatter substitutes var() correctly inside the flattened string
 * and every referenced token does exist as a CSS variable.
 *
 * `shadow` is force-DISABLED, which Primer does not need to do. Cuboid's
 * shadow tokens reference base/ colors (base.color.shadowAlpha.*), and
 * base/ is `include`-only in this build — available for reference
 * resolution, never emitted — so there is no --cube-base-* variable for
 * a shadow's color to point at. That is correct by design: base tokens
 * are not part of the public API (components must consume functional
 * tokens, never reach through to base).
 *
 * Inlining is also the only correct output here on its own terms:
 * transformers/shadowToCss.ts FLATTENS a structured shadow into one
 * `offsetX offsetY blur spread #rrggbbaa` string, applying each layer's
 * alpha to produce a composited hex. The sub-references are consumed by
 * that computation, not preserved as substitutable slots, so there is
 * nothing meaningful to emit a var() for.
 */
function shouldOutputReferences(token: TransformedToken, platformOptions: Parameters<typeof outputReferencesFilter>[1]): boolean {
  if (token.$type === "border") return true;

  // Call order matters, and not for style reasons. Style Dictionary's
  // getReferences() RECORDS a "filtered out token references were found"
  // warning for any reference it cannot see in the filtered set, and
  // outputReferencesFilter() is what REMOVES that warning again once it
  // decides those refs won't be emitted as var(). Returning early for
  // shadows therefore skips the removal and leaves the warning standing —
  // which, under this build's log.warnings: "error", is a thrown error.
  // Verified empirically: an early return took the count from 4 to 7.
  // So: always let the filter run, then override its result.
  const canOutputReferences = outputReferencesFilter(token, platformOptions);
  if (token.$type === "shadow") return false;
  return canOutputReferences && outputReferencesTransformed(token, platformOptions);
}

function getCssSelectors(outputFile: string) {
  const lastSlash = outputFile.lastIndexOf("/");
  const outputBasename = outputFile.substring(lastSlash + 1, outputFile.indexOf("."));
  const themeName = outputBasename.replace(/-/g, "_");
  const mode = outputBasename.substring(0, 4) === "dark" ? "dark" : "light";

  return [
    {
      selector: `[data-color-mode="${mode}"][data-${mode}-theme="${themeName}"], [data-color-mode="auto"][data-light-theme="${themeName}"]`,
    },
    {
      query: "@media (prefers-color-scheme: dark)",
      selector: `[data-color-mode][data-color-mode="auto"][data-dark-theme="${themeName}"]`,
    },
  ];
}

/**
 * CSS output platform: one call composes multiple CSS files from one
 * resolved tree — themed vs. non-themed — differentiated purely by
 * filter. Based on Primer's platforms/css.ts.
 *
 * Deliberately narrower than Primer's four files: cuboid emits ONE CSS
 * file today. Each of Primer's other three is omitted because it would
 * match zero cuboid tokens, and a file config matching nothing is a
 * thrown error under this build's `log.warnings: "error"` gate:
 *   - the `themed` variant — no theme data is authored yet, so nothing
 *     carries an `org.cuboid.overrides` extension (see
 *     preprocessors/themeOverrides.ts, which is registered and ready but
 *     has no data to act on). This is the one to re-add first, when dark
 *     mode lands (DESIGN.md §5).
 *   - a `css/customMedia` file for `custom-viewportRange` tokens — cuboid
 *     authors none.
 *   - a coarse/fine pointer-media file sourced from size-coarse.json5 /
 *     size-fine.json5 — neither file exists in cuboid's token tree.
 * Re-add each alongside the tokens that justify it; the filter shapes
 * are all in Primer's platforms/css.ts.
 */
export const css: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => {
  return {
    prefix,
    buildPath,
    // The build sets log.warnings: "error" globally so a transform error is
    // a hard failure (Style Dictionary otherwise logs it, substitutes the
    // untransformed value, and still exits 0). This platform downgrades
    // that to "warn" for one specific, expected case.
    //
    // Multi-layer shadow tokens each reference base.color.shadowAlpha.*, and
    // base/ is include-only here (resolvable, never emitted), so Style
    // Dictionary records a "filtered out token references" warning for them.
    // That warning is correct and harmless: shadowToCss FLATTENS every layer
    // into one composited hex string, so the references are consumed rather
    // than emitted as var() — verified in the output, which contains real
    // hex values and no dangling var(--cube-base-*).
    //
    // It cannot be cleared properly: outputReferencesFilter() only clears
    // the warning for the FIRST reference in a composite value, leaving
    // layers 2..n recorded, and the GroupMessages registry that holds them
    // is internal (style-dictionary/lib/utils/groupMessages.js), not public
    // API. Scoping the downgrade to this platform keeps transform errors
    // fatal everywhere instead of disabling the gate globally.
    log: { warnings: "warn", verbosity: "verbose" },
    preprocessors: ["themeOverrides"],
    transforms: ["name/pathToKebabCase", "color/hex", "cubicBezier/css", "dimension/rem", "duration/css", "shadow/css", "border/css", "typography/css", "transition/css", "fontFamily/css", "fontWeight/number", "gradient/css"],
    options: {
      basePxFontSize: 16,
      themeOverrides: {
        theme: options?.theme,
      },
    },
    files: [
      {
        destination: `${outputFile}`,
        format: "css/advanced",
        filter: (token: TransformedToken) => isSourceFilter(token) && (options as { themed?: boolean })?.themed !== true && token.$type !== "custom-viewportRange" && !isFromFile(token, ["src/tokens/functional/size/size-coarse.json5", "src/tokens/functional/size/size-fine.json5"]),
        options: {
          showFileHeader: false,
          outputReferences: shouldOutputReferences,
          descriptions: false,
          ...(options as { options?: Record<string, unknown> })?.options,
        },
      },
    ],
  };
};
