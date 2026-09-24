import { z } from "zod";

/**
 * Validates a single token path segment (one object key in the tree) —
 * not a full dot-path. Matches Primer's schemas/tokenName.ts: kebab-case
 * or camelCase, starting with a lowercase letter or digit.
 */
export const tokenName = z.string().regex(
  /^[a-z0-9][A-Za-z0-9-]*$/,
  'Token name must be kebab-case or camelCase, starting with a lowercase letter or number.',
);
