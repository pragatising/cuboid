import type { TransformedToken } from "style-dictionary/types";
import { namePathToDotNotation } from "../namePathToDotNotation";

/**
 * Clear, path-specific errors for a token whose resolved value is missing
 * or malformed — the generic replacement for the old build's scattered
 * console.error/process.exit checks. Matches Primer's
 * transformers/utilities/invalidTokenError.ts.
 */
function tokenName(token: TransformedToken): string {
  return namePathToDotNotation.transform(token, {}, {}) as string;
}

function composeValueErrorMessage(token: TransformedToken): string {
  const originalValue = token.original.$value ?? (token.original as { value?: unknown }).value;
  const value = token.$value ?? (token as { value?: unknown }).value;

  return `Invalid token "${tokenName(token)}" in file "${token.filePath}". Transformed value: "${JSON.stringify(
    value,
  )}". ${originalValue ? `Original value: "${JSON.stringify(originalValue)}" ` : ""}This may be due to referencing a token that does not exist.`;
}

function composeValuePropertyErrorMessage(token: TransformedToken, property: string): string {
  const originalValue = token.original.$value ?? (token.original as { value?: unknown }).value;
  const value = (token.$value ?? (token as { value?: unknown }).value) as Record<string, unknown>;

  return `Invalid property "${property}" of token "${tokenName(token)}" in file "${token.filePath}". Transformed property value: "${
    value?.[property]
  }". ${originalValue ? `Original value: "${(originalValue as Record<string, unknown>)?.[property]}" ` : ""}This may be due to referencing a token that does not exist.`;
}

export class InvalidTokenValueError extends Error {
  constructor(token: TransformedToken) {
    super(composeValueErrorMessage(token));
    Error.captureStackTrace(this, InvalidTokenValueError);
  }
}

export class InvalidTokenValuePropertyError extends Error {
  constructor(token: TransformedToken, property: string) {
    super(composeValuePropertyErrorMessage(token, property));
    Error.captureStackTrace(this, InvalidTokenValuePropertyError);
  }
}
