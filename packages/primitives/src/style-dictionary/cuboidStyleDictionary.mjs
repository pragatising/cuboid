/**
 * Cuboid's Style Dictionary preset — Phase 0 scaffolding.
 *
 * Status: inert. Nothing in the real build (`tokens:theme`) calls this yet.
 * Registers only the transforms cuboid's current token set actually needs,
 * matching the hand-rolled behavior in scripts/build-theme.mjs and
 * scripts/build-theme-css.mjs so Phase 1 can prove byte-identical output
 * before anything is cut over. See docs/token-architecture-migration.md.
 */

import StyleDictionary from "style-dictionary";

const PX_TO_REM_BASE = Number(process.env.SIZE_BASE_PX ?? 16);

const CuboidStyleDictionary = new StyleDictionary({
  log: { verbosity: "default" },
});

/**
 * px → rem, honoring SIZE_BASE_PX like build-theme.mjs's pxStringToRem.
 * Passes non-px-string values through unchanged rather than guessing.
 */
CuboidStyleDictionary.registerTransform({
  name: "cuboid/dimension/rem",
  type: "value",
  filter: (token) => typeof token.value === "string" && /^\d+(\.\d+)?px$/.test(token.value),
  transform: (token) => {
    const match = token.value.match(/^(\d+(?:\.\d+)?)px$/);
    const px = Number(match[1]);
    const rem = Math.round((px / PX_TO_REM_BASE) * 10000) / 10000;
    return `${rem}rem`;
  },
});

/**
 * kebab-case CSS custom property names, preserving inner camelCase —
 * matches build-theme-css.mjs's existing emitNestedStringVars output
 * (e.g. bgColor -> --cube-bg-color, not --cube-bgcolor).
 */
CuboidStyleDictionary.registerTransform({
  name: "cuboid/name/kebab",
  type: "name",
  transform: (token) =>
    `cube-${token.path
      .join("-")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()}`,
});

export { CuboidStyleDictionary };
