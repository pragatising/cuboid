import type { TransformedToken } from "style-dictionary/types";
import { InvalidTokenValueError, InvalidTokenValuePropertyError } from "./invalidTokenError.ts";

/**
 * Given an already-resolved token, pulls `$value` (or one composite
 * sub-property, e.g. a shadow's `.color`), throwing a clear error if
 * missing. This is NOT a reference resolver — Style Dictionary resolves
 * `{path}` references natively before any transformer runs (see
 * DESIGN.md §3). Matches Primer's real, narrow definition in
 * transformers/utilities/getTokenValue.ts.
 */
export function getTokenValue(token: TransformedToken, property?: string): unknown {
  const value = token.$value ?? (token as { value?: unknown }).value;

  if (value === undefined) {
    throw new InvalidTokenValueError(token);
  }

  if (typeof property === "string") {
    const record = value as Record<string, unknown>;
    if (record[property] === undefined) {
      throw new InvalidTokenValuePropertyError(token, property);
    }
    return record[property];
  }

  return value;
}
