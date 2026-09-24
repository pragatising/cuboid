import { z } from "zod";
import { joinFriendly } from "../utilities/joinFriendly.ts";
import { schemaErrorMessage } from "../utilities/schemaErrorMessage.ts";

/**
 * Validates a token's declared `org.cuboid.figma.scopes` array against an
 * allowed list, passed in per-type by the caller. Matches Primer's
 * schemas/scopes.ts shape — generic validator, not Primer's own hardcoded
 * scope names (same reasoning as collections.ts).
 */
export function scopes(allowed: string[]) {
  return z.array(z.string()).superRefine((value, ctx) => {
    if (!value.every((item) => allowed.includes(item))) {
      ctx.addIssue({
        code: "custom",
        message: schemaErrorMessage(`Invalid scope: "${value.join(", ")}"`, `Valid scopes are: ${joinFriendly(allowed)}`),
      });
    }
  });
}
