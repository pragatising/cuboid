import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Style Dictionary name transform: a token's `.path` array -> one
 * kebab-case CSS custom property name (e.g. ["button", "bgColor"] ->
 * "button-bgColor" — inner camelCase is preserved, not split further;
 * matches Primer's real namePathToKebabCase.ts). The "cube" prefix comes
 * from Style Dictionary's own `prefix` platform option, not hardcoded
 * here — set it once in the platform config, not per-transform.
 */
export const nameToKebabCase: Transform = {
  name: "name/pathToKebabCase",
  type: "name",
  transform: (token: TransformedToken, options?: PlatformConfig): string => {
    const path = [...token.path];

    // Size-scale steps are authored by their px value ('1', '24'), so a bare
    // kebab join would emit the ambiguous `--cube-size-1`. Suffix the unit so
    // a stylesheet author reads the value directly: `--cube-size-1px`.
    // The JSON output instead renames these to the proportional Nx scale
    // (see formats/utilities/pxKeyToNx.ts) — the two consumers want
    // different things from the same token.
    if (path.length === 2 && path[0] === "size" && /^\d+$/.test(path[1])) {
      path[1] = `${path[1]}px`;
    }

    return [options?.prefix, ...path]
      .filter((part): part is string => typeof part === "string" && part !== "@")
      .join("-");
  },
};
