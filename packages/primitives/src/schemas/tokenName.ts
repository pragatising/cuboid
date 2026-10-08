import { z } from "zod";

/**
 * Validates a single token path segment (one object key in the tree) —
 * not a full dot-path. Matches Primer's schemas/tokenName.ts: kebab-case
 * or camelCase, starting with a lowercase letter or digit — widened
 * (beyond Primer's version) to also allow a bare decimal fraction
 * ("0.05"), confirmed real and intentional: base/colors/light.json5's
 * `shadowAlpha.black["0.05"]` etc. use the alpha value itself as the
 * path segment (one near-black hue paired with the exact alpha a real
 * shadow needs), not an identifier name.
 */
export const tokenName = z.string().regex(
  /^[a-z0-9][A-Za-z0-9-]*$|^0\.\d+$/,
  'Token name must be kebab-case or camelCase (starting with a lowercase letter or number), or a bare decimal fraction like "0.05".',
);
