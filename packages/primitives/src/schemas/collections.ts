import { z } from "zod";
import { joinFriendly } from "../utilities/joinFriendly";
import { schemaErrorMessage } from "../utilities/schemaErrorMessage";

/**
 * Validates a token's declared `org.cuboid.figma.collection` name against
 * an allowed list, passed in per-type by the caller. Matches Primer's
 * schemas/collections.ts shape — the generic validator, not Primer's own
 * hardcoded collection names (cuboid's real `org.cuboid.figma` collection
 * naming isn't decided yet; each per-type schema passes its own real list
 * once that's known, rather than this file guessing Primer's names apply).
 */
export function collection(allowed: string[]) {
  return z.string().superRefine((value, ctx) => {
    if (!allowed.includes(value)) {
      ctx.addIssue({
        code: "custom",
        message: schemaErrorMessage(`Invalid collection: "${value}"`, `Valid collections are ${joinFriendly(allowed)}`),
      });
    }
  });
}

/**
 * Validates a token's declared theme-mode name (e.g. `org.cuboid.overrides`
 * keys, or a color token's `org.cuboid.figma.modeOverride`) against an
 * allowed list, passed in by the caller. Same generic shape as
 * `collection()`/`scopes()` — infrastructure for the dark-mode/theme-
 * overrides mechanism (DESIGN.md §5), built ahead of any real mode data
 * existing. No hardcoded mode names (cuboid's real theme-name list isn't
 * decided yet — DESIGN.md §5 currently only commits to "light/dark to
 * start"), matching Primer's schemas/collections.ts `mode()` shape.
 */
export function mode(allowed: string[]) {
  return z.string().superRefine((value, ctx) => {
    if (!allowed.includes(value)) {
      ctx.addIssue({
        code: "custom",
        message: schemaErrorMessage(`Invalid mode: "${value}"`, `Valid modes are ${joinFriendly(allowed)}`),
      });
    }
  });
}
