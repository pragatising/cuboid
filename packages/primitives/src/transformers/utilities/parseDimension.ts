import type { DimensionTokenValue } from "../../types/dimensionTokenValue";

/**
 * Parses and validates a dimension value in W3C DTCG object format
 * ({value: number, unit: "px"|"rem"|"em"}), throwing a clear error for
 * anything else. Matches Primer's transformers/utilities/parseDimension.ts.
 */
export function parseDimension(input: unknown): DimensionTokenValue {
  if (typeof input !== "object" || input === null) {
    throw new Error(`Invalid dimension value: ${JSON.stringify(input)} - must be a W3C DTCG dimension object with "value" and "unit" properties`);
  }

  const obj = input as Record<string, unknown>;
  if (!("value" in obj) || !("unit" in obj)) {
    throw new Error(`Invalid dimension value: ${JSON.stringify(input)} - must be a W3C DTCG dimension object with "value" and "unit" properties`);
  }

  const { value, unit } = obj;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid dimension value: ${JSON.stringify(input)} - value must be a finite number`);
  }

  if (unit !== "px" && unit !== "rem" && unit !== "em") {
    throw new Error(`Invalid dimension unit: ${String(unit)} - must be "px", "rem", or "em"`);
  }

  return { value, unit };
}
