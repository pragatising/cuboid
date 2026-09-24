import { isFromFile } from "../filters/isFromFile";
import { isSource as isSourceFilter } from "../filters/isSource";
import type { PlatformInitializer } from "../types/platformInitializer";
import type { PlatformConfig, TransformedToken } from "style-dictionary/types";
import { outputReferencesTransformed, outputReferencesFilter } from "style-dictionary/utils";

/**
 * Determines whether a token's value should use CSS variable references
 * rather than an inlined resolved value. Border tokens need special
 * handling (composite values report as non-string originals, and their
 * component tokens live in a separate output file). Matches Primer's
 * platforms/css.ts.
 */
function shouldOutputReferences(token: TransformedToken, platformOptions: Parameters<typeof outputReferencesFilter>[1]): boolean {
  if (token.$type === "border") return true;
  return outputReferencesFilter(token, platformOptions) && outputReferencesTransformed(token, platformOptions);
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
 * CSS output platform: one call composes up to four separate CSS files
 * from one resolved tree — themed vs. non-themed, coarse/fine pointer
 * media, all differentiated purely by filter. Matches Primer's
 * platforms/css.ts.
 */
export const css: PlatformInitializer = (outputFile, prefix, buildPath, options): PlatformConfig => {
  return {
    prefix,
    buildPath,
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
        filter: (token: TransformedToken) => isSourceFilter(token) && (options as { themed?: boolean })?.themed === true && token.$type !== "custom-viewportRange" && token.$type !== "dimension" && !isFromFile(token, ["src/tokens/functional/size/size-coarse.json5", "src/tokens/functional/size/size-fine.json5"]),
        options: {
          showFileHeader: false,
          outputReferences: shouldOutputReferences,
          descriptions: false,
          queries: getCssSelectors(outputFile),
          ...(options as { options?: Record<string, unknown> })?.options,
        },
      },
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
      {
        destination: `${outputFile}`,
        format: "css/customMedia",
        filter: (token: TransformedToken) => isSourceFilter(token) && (options as { themed?: boolean })?.themed !== true && token.$type === "custom-viewportRange",
        options: {
          showFileHeader: false,
          outputReferences: shouldOutputReferences,
        },
      },
      {
        destination: `${outputFile}`,
        format: "css/advanced",
        filter: (token: TransformedToken) => isSourceFilter(token) && isFromFile(token, ["src/tokens/functional/size/size-coarse.json5", "src/tokens/functional/size/size-fine.json5"]),
        options: {
          descriptions: false,
          outputReferences: shouldOutputReferences,
          showFileHeader: false,
          queries: [
            {
              query: "@media (pointer: fine)",
              matcher: (token: TransformedToken) => token.filePath.includes("size-fine"),
            },
            {
              query: "@media (pointer: coarse)",
              matcher: (token: TransformedToken) => token.filePath.includes("size-coarse"),
            },
          ],
        },
      },
    ],
  };
};
