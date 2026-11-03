import type { PropInfo, SelectorType } from "../types";
import { functionOf } from "./functionType";

/** The most values a tray holds side by side; more are a list to choose from. */
export const TRAY = 4;

/**
 * Which of the Figma's selectors a prop has, from what the engine read of its type (`kind`, its values, the parts it is made of). One
 * pure mapping, so the data model and the design meet in one place:
 *
 * | the type is…                                     | selector    |
 * | on or off                                        | `boolean`   |
 * | up to four values                                | `enum`      |
 * | more values, or one named set (`FgColor`)        | `token`     |
 * | several sets and shapes (`FgColor | CssColor`)   | `tokenSets` |
 * | text, a number                                   | `string`, `number` |
 * | a slot (`ReactNode`)                             | `react`     |
 * | a function                                       | `function`  |
 * | anything else (a ref, an object, an array)       | `type`      |
 */
export function selectorOf(prop: PropInfo): SelectorType {
  switch (prop.kind) {
    case "flag":
      return "boolean";
    case "enum":
      return prop.values?.length ? (prop.values.length > TRAY ? "token" : "enum") : "type";
    case "slot":
      return "react";
    case "event":
    case "function":
      return functionOf(prop.type) ? "function" : "type";
    case "value":
    case "other":
    case "open":
      if (prop.members?.length) return prop.members.length > 1 ? "tokenSets" : "token";
      return prop.kind === "value" ? (prop.type === "number" ? "number" : "string") : "type";
    default:
      return "type";
  }
}
