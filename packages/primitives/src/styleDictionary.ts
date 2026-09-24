/**
 * Cuboid's Style Dictionary instance — the single place every transform,
 * format, filter, and preprocessor is registered. Mirrors Primer's own
 * primerStyleDictionary.ts: one exported instance, everything else in this
 * package (platforms, scripts) extends it rather than constructing its own.
 * Unprefixed transform names (unlike Primer's `primer/...`) since this
 * package is never published standalone — no external registry to collide
 * with (see packages/primitives/DESIGN.md §7).
 *
 * Some names below (`color/hex`, `cubicBezier/css`, `fontFamily/css`)
 * intentionally shadow Style Dictionary's own built-in transforms of the
 * same name — confirmed this matches Primer's real, working setup (Primer
 * registers its own `color/hex` under the identical name for the same
 * reason: the built-in doesn't know about DTCG's `alpha` sibling-key shape
 * or fontFamily arrays). `registerTransform` silently replaces an existing
 * hook of the same name — verified in Style Dictionary's own source
 * (Register.js's `deleteExistingHook` call) — so this is a deliberate,
 * working override, not an accidental collision.
 */
import StyleDictionary from "style-dictionary";

// Value transforms
import { colorToHex } from "./transformers/colorToHex.ts";
import { colorToRgbAlpha } from "./transformers/colorToRgbAlpha.ts";
import { colorToRgbaFloat } from "./transformers/colorToRgbaFloat.ts";
import { dimensionToRem } from "./transformers/dimensionToRem.ts";
import { dimensionToPixelUnitless } from "./transformers/dimensionToPixelUnitless.ts";
import { dimensionToRemPxArray } from "./transformers/dimensionToRemPxArray.ts";
import { cubicBezierToCss } from "./transformers/cubicBezierToCss.ts";
import { durationToCss } from "./transformers/durationToCss.ts";
import { shadowToCss } from "./transformers/shadowToCss.ts";
import { borderToCss } from "./transformers/borderToCss.ts";
import { transitionToCss } from "./transformers/transitionToCss.ts";
import { typographyToCss } from "./transformers/typographyToCss.ts";
import { gradientToCss } from "./transformers/gradientToCss.ts";
import { fontFamilyToCss } from "./transformers/fontFamilyToCss.ts";
import { fontFamilyToFigma } from "./transformers/fontFamilyToFigma.ts";
import { fontWeightToNumber } from "./transformers/fontWeightToNumber.ts";
import { floatToPixel, floatToPixelUnitless } from "./transformers/floatToPixel.ts";
import { jsonDeprecated } from "./transformers/jsonDeprecated.ts";

// Name transforms
import { nameToKebabCase } from "./transformers/nameToKebabCase.ts";
import { namePathToCamelCase } from "./transformers/namePathToCamelCase.ts";
import { namePathToDotNotation } from "./transformers/namePathToDotNotation.ts";
import { namePathToFigma } from "./transformers/namePathToFigma.ts";
import { namePathToPascalCase } from "./transformers/namePathToPascalCase.ts";
import { namePathToSlashNotation } from "./transformers/namePathToSlashNotation.ts";

// Attribute transform
import { figmaAttributes } from "./transformers/figmaAttributes.ts";

// Formats
import { cssAdvanced } from "./formats/cssAdvanced.ts";
import { cssCustomMedia } from "./formats/cssCustomMedia.ts";
import { javascriptCommonJs } from "./formats/javascriptCommonJs.ts";
import { javascriptEsm } from "./formats/javascriptEsm.ts";
import { jsonFigma } from "./formats/jsonFigma.ts";
import { jsonNestedPrefixed } from "./formats/jsonNestedPrefixed.ts";
import { jsonOneDimensional } from "./formats/jsonOneDimensional.ts";
import { jsonPostCssFallback } from "./formats/jsonPostCssFallback.ts";
import { markdownLlmGuidelines } from "./formats/markdownLlmGuidelines.ts";
import { typescriptExportDefinition } from "./formats/typescriptExportDefinition.ts";

// Preprocessors
import { themeOverrides } from "./preprocessors/themeOverrides.ts";
import { inheritGroupProperties } from "./preprocessors/inheritGroupProperties.ts";

export const styleDictionary = new StyleDictionary({
  log: { verbosity: "default" },
});

// -- Value transforms --
styleDictionary.registerTransform(colorToHex);
styleDictionary.registerTransform(colorToRgbAlpha);
styleDictionary.registerTransform(colorToRgbaFloat);
styleDictionary.registerTransform(dimensionToRem);
styleDictionary.registerTransform(dimensionToPixelUnitless);
styleDictionary.registerTransform(dimensionToRemPxArray);
styleDictionary.registerTransform(cubicBezierToCss);
styleDictionary.registerTransform(durationToCss);
styleDictionary.registerTransform(shadowToCss);
styleDictionary.registerTransform(borderToCss);
styleDictionary.registerTransform(transitionToCss);
styleDictionary.registerTransform(typographyToCss);
styleDictionary.registerTransform(gradientToCss);
styleDictionary.registerTransform(fontFamilyToCss);
styleDictionary.registerTransform(fontFamilyToFigma);
styleDictionary.registerTransform(fontWeightToNumber);
styleDictionary.registerTransform(floatToPixel);
styleDictionary.registerTransform(floatToPixelUnitless);
styleDictionary.registerTransform(jsonDeprecated);

// -- Name transforms --
styleDictionary.registerTransform(nameToKebabCase);
styleDictionary.registerTransform(namePathToCamelCase);
styleDictionary.registerTransform(namePathToDotNotation);
styleDictionary.registerTransform(namePathToFigma);
styleDictionary.registerTransform(namePathToPascalCase);
styleDictionary.registerTransform(namePathToSlashNotation);

// -- Attribute transform --
styleDictionary.registerTransform(figmaAttributes);

// -- Formats --
styleDictionary.registerFormat({ name: "css/advanced", format: cssAdvanced });
styleDictionary.registerFormat({ name: "css/customMedia", format: cssCustomMedia });
styleDictionary.registerFormat({ name: "javascript/commonJs", format: javascriptCommonJs });
styleDictionary.registerFormat({ name: "javascript/esm", format: javascriptEsm });
styleDictionary.registerFormat({ name: "json/figma", format: jsonFigma });
styleDictionary.registerFormat({ name: "json/nested-prefixed", format: jsonNestedPrefixed });
styleDictionary.registerFormat({ name: "json/one-dimensional", format: jsonOneDimensional });
styleDictionary.registerFormat({ name: "json/postCss-fallback", format: jsonPostCssFallback });
styleDictionary.registerFormat({ name: "markdown/llm-guidelines", format: markdownLlmGuidelines });
styleDictionary.registerFormat({ name: "typescript/export-definition", format: typescriptExportDefinition });

// -- Preprocessors --
styleDictionary.registerPreprocessor(themeOverrides);
styleDictionary.registerPreprocessor(inheritGroupProperties);
