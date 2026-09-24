import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";

/**
 * Token path segments -> a Figma variable-path string, collapsing the
 * common `{fgColor|borderColor|bgColor}.<category>.<step>` 3-segment
 * shape into `<type>/<category>-<step>` (Figma's own convention for
 * color scale variables). Matches Primer's transformers/namePathToFigma.ts.
 */
export function transformNamePathToFigma(token: TransformedToken, options?: PlatformConfig): string {
  let pathArray = token.path.filter((part): part is string => part !== "@");

  if (["fgColor", "borderColor", "bgColor"].includes(pathArray[0]) && pathArray.length === 3) {
    pathArray = [pathArray[0], `${pathArray[1]}-${pathArray[2]}`];
  }

  return [options?.prefix, ...pathArray].filter((part): part is string => typeof part === "string" && part !== "@").join("/");
}

export const namePathToFigma: Transform = {
  name: "name/pathToFigma",
  type: "name",
  transform: transformNamePathToFigma,
};
