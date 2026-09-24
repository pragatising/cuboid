import { z } from "zod";
import { tokenName } from "./tokenName.ts";
import { stringToken } from "./stringToken.ts";
import { viewportRangeToken } from "./viewportRangeToken.ts";
import { numberToken } from "./numberToken.ts";
import { fontWeightToken } from "./fontWeightToken.ts";
import { typographyToken } from "./typographyToken.ts";
import { borderToken } from "./borderToken.ts";
import { dimensionToken } from "./dimensionToken.ts";
import { colorToken } from "./colorToken.ts";
import { fontFamilyToken } from "./fontFamilyToken.ts";
import { shadowToken } from "./shadowToken.ts";
import { durationToken } from "./durationToken.ts";
import { cubicBezierToken } from "./cubicBezierToken.ts";
import { gradientToken } from "./gradientToken.ts";
import { transitionToken } from "./transitionToken.ts";
import { llmExtension } from "./llmExtension.ts";

/**
 * Group-level $extensions schema (W3C Design Tokens spec — group
 * properties, not leaf-level). Matches Primer's schemas/designToken.ts.
 */
const groupExtensions = z
  .object({
    "org.cuboid.llm": llmExtension,
  })
  .loose();

/**
 * Discriminated union of every real per-type token schema this pipeline
 * validates. Matches Primer's schemas/designToken.ts tokenTypes union —
 * strokeStyleToken deliberately absent (neither cuboid nor Primer builds
 * it, see DESIGN.md).
 */
const tokenTypes = z.discriminatedUnion("$type", [
  colorToken,
  cubicBezierToken,
  dimensionToken,
  shadowToken,
  borderToken,
  fontFamilyToken,
  fontWeightToken,
  gradientToken,
  typographyToken,
  viewportRangeToken,
  numberToken,
  durationToken,
  stringToken,
  transitionToken,
]);

/**
 * Validates a whole token tree: every key is either a group property
 * ($description/$extensions) or a token name, and every non-$-prefixed
 * value is either a real token (has $type) or a nested group (recurse).
 * Matches Primer's schemas/designToken.ts createDesignTokenSchema.
 */
function createDesignTokenSchema(): z.ZodType<unknown> {
  return z.record(z.string(), z.unknown()).superRefine((obj, ctx) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$description") {
        if (typeof value !== "string") {
          ctx.addIssue({ code: "custom", message: "$description must be a string", path: [key] });
        }
        continue;
      }

      if (key === "$extensions") {
        if (typeof value !== "object" || value === null) {
          ctx.addIssue({ code: "custom", message: "$extensions must be an object", path: [key] });
        } else {
          const result = groupExtensions.safeParse(value);
          if (!result.success) {
            for (const issue of result.error.issues) {
              ctx.addIssue({ ...issue, path: [key, ...issue.path] });
            }
          }
        }
        continue;
      }

      if (key.startsWith("$")) {
        ctx.addIssue({ code: "custom", message: `Unknown group property: ${key}. Only $description and $extensions are allowed.`, path: [key] });
        continue;
      }

      const nameResult = tokenName.safeParse(key);
      if (!nameResult.success) {
        for (const issue of nameResult.error.issues) {
          ctx.addIssue({ ...issue, path: [key] });
        }
      }

      if (typeof value === "object" && value !== null) {
        if ("$type" in value) {
          const tokenResult = tokenTypes.safeParse(value);
          if (!tokenResult.success) {
            for (const issue of tokenResult.error.issues) {
              ctx.addIssue({ ...issue, path: [key, ...issue.path] });
            }
          }
        } else {
          const nestedResult = designToken.safeParse(value);
          if (!nestedResult.success) {
            for (const issue of nestedResult.error.issues) {
              ctx.addIssue({ ...issue, path: [key, ...issue.path] });
            }
          }
        }
      } else {
        ctx.addIssue({ code: "custom", message: `Expected token or group object, got ${typeof value}`, path: [key] });
      }
    }
  });
}

export const designToken: z.ZodType<unknown> = createDesignTokenSchema();
