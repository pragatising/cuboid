import { z } from "zod";
import { schemaErrorMessage } from "../utilities/schemaErrorMessage.ts";

/**
 * Valid fontWeight numeric values. Matches Primer's
 * schemas/fontWeightValue.ts.
 */
const ALLOWED = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const fontWeightValue = z.number().superRefine((value, ctx) => {
  if (!ALLOWED.includes(value)) {
    ctx.addIssue({
      code: "custom",
      message: schemaErrorMessage(`Invalid font weight value: "${value}"`, `Font weight must be one of ${ALLOWED.join(", ")}`),
    });
  }
});
