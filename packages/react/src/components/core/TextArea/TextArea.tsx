import React from "react";
import { clsx } from "clsx";
import { InputField, useFieldControl } from "../InputField";
import type { InputFieldSize } from "../InputField";
import classes from "./TextArea.module.css";

export type TextAreaProps = Omit<React.ComponentPropsWithRef<"textarea">, "color"> & {
  /** The visible label, tied to the textarea. Without one, give it an `aria-label`. */
  label?: React.ReactNode;
  /** Help text under the field. */
  description?: React.ReactNode;
  /** The validation message under the field. Its presence puts the field in the error state and sets `aria-invalid`. */
  error?: React.ReactNode;
  /** The field's minimum height, radius and icon size: `sm` 24px, `md` 28px, `lg` 32px (as Button). It grows with its rows. @default "md" */
  size?: InputFieldSize;
  /** A visual by the first line, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
  /** A visual by the first line, at the end. Hidden from assistive technology. */
  trailingVisual?: React.ReactNode;
  /** Merged onto the outer wrapper (label, field, help text); `className` and `style` go to the textarea. */
  wrapperClassName?: string;
  /** Other attributes for the outer wrapper (`data-*`, `id`…): they go there, not to the control. */
  wrapperProps?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  /** Points at the field's bordered box (without the label and help text around it). */
  shellRef?: React.Ref<HTMLDivElement>;
};

/**
 * A multi-line text field: the same label, box and help text or error as `InputText`, around a native `<textarea>`. The box
 * grows with the `rows` and can be resized from its bottom edge. Like a native `<textarea>`, `className`, `style`, `value`, `rows`,
 * `maxLength`, `placeholder`, `aria-*`… go to the textarea and `ref` points at it (ADR-05). Its look is the `input` tokens, read in CSS.
 */
export function TextArea({
  label,
  description,
  error,
  size = "md",
  leadingVisual,
  trailingVisual,
  wrapperClassName,
  wrapperProps,
  shellRef,
  id,
  className,
  disabled,
  readOnly,
  rows = 3,
  ref,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextAreaProps) {
  const { controlId, invalid, describedby } = useFieldControl({ id, description, error, "aria-describedby": ariaDescribedBy });

  return (
    <InputField data-component="TextArea" {...wrapperProps} label={label} controlId={controlId} description={description} error={error} disabled={disabled} className={clsx(wrapperClassName, wrapperProps?.className)}>
      <InputField.Shell ref={shellRef} size={size} leadingVisual={leadingVisual} trailingVisual={trailingVisual} invalid={invalid} disabled={disabled} readOnly={readOnly} multiline>
        <textarea
          {...props}
          ref={ref}
          id={controlId}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          className={clsx(classes.TextArea, className)}
        />
      </InputField.Shell>
    </InputField>
  );
}
