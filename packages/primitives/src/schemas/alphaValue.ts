import { z } from "zod";

/**
 * Alpha channel value — a number between 0 and 1. Matches Primer's
 * schemas/alphaValue.ts. Cuboid's real color tokens carry `alpha` as a
 * sibling key to `$value` (e.g. `{ $value: "#ffffff", alpha: 0 }`), not
 * folded into the value itself.
 */
export const alphaValue = z.number().min(0).max(1);
