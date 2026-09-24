import { z } from "zod";
import { schemaErrorMessage } from "../utilities/schemaErrorMessage";

/**
 * Validates a 3/6/8-digit hex color string. Matches Primer's
 * schemas/colorHexValue.ts.
 */
const HEX_PATTERN = /^(#[0-9a-f]{3}$)|(#[0-9a-f]{6}$)|(#[0-9a-f]{8}$)/i;

export const colorHexValue = z.string().superRefine((color, ctx) => {
  if (!HEX_PATTERN.test(color)) {
    ctx.addIssue({
      code: "custom",
      message: schemaErrorMessage(`Invalid color: "${color}"`, "Color must be a hex string or a reference to a color token."),
    });
  }
});
