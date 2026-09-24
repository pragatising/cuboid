import type { Transform, TransformedToken } from "style-dictionary/types";
import { isFontFamily } from "../filters/isFontFamily";
import { getTokenValue } from "./utilities/getTokenValues";
import { hasSpaceInString } from "./utilities/hasSpaceInStrings";

/**
 * A fontFamily $value (string or string array) -> a CSS-ready
 * font-family value, quoting family names that contain spaces (e.g.
 * "Segoe UI"). Matches Primer's transformers/fontFamilyToCss.ts.
 */
export function parseFontFamily(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item !== "string") {
          throw new Error(`Invalid value in array ${item}, must be a string`);
        }
        return hasSpaceInString(item) ? `'${item}'` : item;
      })
      .join(", ");
  }
  throw new Error(`Invalid value ${value}, should be a string or array of strings`);
}

export const fontFamilyToCss: Transform = {
  name: "fontFamily/css",
  type: "value",
  transitive: true,
  filter: isFontFamily,
  transform: (token: TransformedToken): string => parseFontFamily(getTokenValue(token)),
};
