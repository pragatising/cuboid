import React from "react";
import { clsx } from "clsx";
import { InputField, useFieldControl } from "../InputField";
import type { InputFieldSize } from "../InputField";
import classes from "./InputText.module.css";

export type InputTextProps = Omit<React.ComponentPropsWithRef<"input">, "size" | "color"> & {
  /** The visible label, tied to the input. Without one, give the input an `aria-label`. */
  label?: React.ReactNode;
  /** Help text under the field. */
  description?: React.ReactNode;
  /** The validation message under the field. Its presence puts the field in the error state and sets `aria-invalid`. */
  error?: React.ReactNode;
  /** The field's height: `sm` 24px, `md` 28px, `lg` 32px (as Button). @default "md" */
  size?: InputFieldSize;
  /** A visual before the text, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
  /** A visual after the text. Hidden from assistive technology. */
  trailingVisual?: React.ReactNode;
  /** Merged onto the outer wrapper (label, field, help text); `className` and `style` go to the input. */
  wrapperClassName?: string;
  /** Other attributes for the outer wrapper (`data-*`, `id`…): they go there, not to the control. */
  wrapperProps?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  /** Points at the field's bordered box (without the label and help text around it): what a popup anchors to. */
  shellRef?: React.Ref<HTMLDivElement>;
};

/**
 * A single-line text field: an optional label, the field with an optional leading and trailing visual, and help text or a
 * validation message under it. Like a native `<input>`, everything that is not the field's own chrome goes to the input:
 * `className`, `style`, `value`, `name`, `placeholder`, `aria-*`, `type`…, and `ref` points at it (ADR-05). Its look is the
 * `input` tokens, read in CSS (see InputField.module.css).
 */
export function InputText({
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
  ref,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputTextProps) {
  const { controlId, invalid, describedby } = useFieldControl({ id, description, error, "aria-describedby": ariaDescribedBy });

  return (
    <InputField data-component="InputText" {...wrapperProps} label={label} controlId={controlId} description={description} error={error} disabled={disabled} className={clsx(wrapperClassName, wrapperProps?.className)}>
      <InputField.Shell ref={shellRef} size={size} leadingVisual={leadingVisual} trailingVisual={trailingVisual} invalid={invalid} disabled={disabled} readOnly={readOnly}>
        <input
          {...props}
          ref={ref}
          id={controlId}
          type={props.type ?? "text"}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          className={clsx(classes.Input, className)}
        />
      </InputField.Shell>
    </InputField>
  );
}
