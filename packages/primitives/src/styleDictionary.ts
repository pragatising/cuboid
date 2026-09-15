/**
 * Cuboid's Style Dictionary instance — the single place every transform,
 * format, and preprocessor is registered. Mirrors Primer's own
 * primerStyleDictionary.ts: one exported instance, everything else in this
 * package (platforms, scripts) extends it rather than constructing its own.
 * Unprefixed transform names (unlike Primer's `primer/...`) since this
 * package is never published standalone — no external registry to collide
 * with (see docs/token-architecture-migration.md §7).
 */
import StyleDictionary from "style-dictionary";
import { isPxDimension, dimensionToRem } from "./transformers/dimensionToRem";
import { nameToKebabCase } from "./transformers/nameToKebabCase";

export const styleDictionary = new StyleDictionary({
  log: { verbosity: "default" },
});

styleDictionary.registerTransform({
  name: "dimension/rem",
  type: "value",
  filter: (token) => isPxDimension(token.value),
  transform: (token) => dimensionToRem(token.value),
});

styleDictionary.registerTransform({
  name: "name/kebab",
  type: "name",
  transform: (token) => nameToKebabCase(token.path),
});
