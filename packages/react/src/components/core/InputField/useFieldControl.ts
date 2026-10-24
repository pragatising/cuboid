import { useId } from "react";
import type React from "react";
import { isPresent } from "../../../utils/isPresent";
import { describedBy } from "./InputField";

export type FieldControlOptions = {
  /** The consumer's id for the control. Without one, one is made. */
  id?: string;
  description?: React.ReactNode;
  /** The validation message; its presence puts the field in the error state. */
  error?: React.ReactNode;
  /** The consumer's own `aria-describedby`, kept after the help text and the error. */
  "aria-describedby"?: string;
};

/**
 * What a form control needs from its field: its id (so the label, help text and error can point at it), whether it is invalid,
 * and the `aria-describedby` that names the help text and the error (then the consumer's own). Shared by `InputText`,
 * `TextArea` and `Select`; the control spreads `id`, `aria-invalid` and `aria-describedby` from it.
 */
export function useFieldControl({ id, description, error, "aria-describedby": consumerDescribedBy }: FieldControlOptions) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const invalid = isPresent(error);
  const describedby = [describedBy(controlId, { description, error }), consumerDescribedBy].filter(Boolean).join(" ") || undefined;
  return { controlId, invalid, describedby };
}
