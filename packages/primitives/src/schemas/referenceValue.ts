import { z } from "zod";

/**
 * A whole-value {path.to.token} reference — matches Primer's
 * schemas/referenceValue.ts. Valid on any $type; the resolver follows it
 * before the type-specific transform ever runs (see DESIGN.md §1).
 *
 * This validates only the WHOLE-VALUE reference form ("{a.b.c}"). Cuboid's
 * real token files also embed a reference inside a larger string
 * (e.g. "inset 0 0 0 {borderWidth.thin}") — that form is a plain string
 * for schema purposes; the embedded {...} is resolved at the reference-
 * resolution step, not validated here.
 */
export const referenceValue = z
  .string()
  .regex(/^\{[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\}$/, 'Reference must be a string in the format "{path.to.token}".');
