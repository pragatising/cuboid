import type { Transform, TransformedToken } from "style-dictionary/types";
import { isDeprecated } from "../filters/isDeprecated";

/**
 * Replaces a deprecated token's value with the string naming its
 * replacement (stripped of {} reference syntax), or null if
 * `$deprecated` isn't a string. Matches Primer's
 * transformers/jsonDeprecated.ts.
 */
export const jsonDeprecated: Transform = {
  name: "json/deprecated",
  type: "value",
  transitive: true,
  filter: isDeprecated,
  transform: (token: TransformedToken) => {
    const deprecated = (token.original as { $deprecated?: unknown }).$deprecated ?? token.$deprecated;
    return typeof deprecated === "string" ? deprecated.replace(/[{}]/g, "") : null;
  },
};
