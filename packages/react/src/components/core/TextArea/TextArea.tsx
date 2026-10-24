import React from "react";
import { clsx } from "clsx";
import { useAutoGrow, useProvidedRefOrCreate } from "../../../behaviors";
import { InputField, useCharacterCount, useFieldControl } from "../InputField";
import type { InputFieldProps, InputFieldSize } from "../InputField";
import classes from "./TextArea.module.css";

export type TextAreaProps = Omit<React.ComponentPropsWithRef<"textarea">, "color"> &
  Pick<InputFieldProps, "labelHelp" | "descriptionVisual" | "errorVisual"> & {
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
    /** Show how much has been typed under the field: `12 / 100` with a `maxLength`, `12` without. @default false */
    showCount?: boolean;
    /** Grow with the text, from `rows` lines up to `maxRows` (then scroll). Turns off the resize handle. @default false */
    autoGrow?: boolean;
    /** With `autoGrow`, the most lines it grows to. Unset, it grows without limit. */
    maxRows?: number;
    /** Merged onto the outer wrapper (label, field, help text); `className` and `style` go to the textarea. */
    wrapperClassName?: string;
    /** Other attributes for the outer wrapper (`data-*`, `id`…): they go there, not to the control. */
    wrapperProps?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
    /** Points at the field's bordered box (without the label and help text around it). */
    shellRef?: React.Ref<HTMLDivElement>;
  };

/**
 * A multi-line text field: the same label, box and help text or error as `InputText`, around a native `<textarea>`. The box
 * grows with the `rows` and can be resized from its bottom edge, or with `autoGrow` follows the text. Like a native `<textarea>`,
 * `className`, `style`, `value`, `rows`, `maxLength`, `placeholder`, `aria-*`… go to the textarea and `ref` points at it
 * (ADR-05). Its look is the `input` tokens, read in CSS.
 */
export function TextArea({
  label,
  labelHelp,
  description,
  descriptionVisual,
  error,
  errorVisual,
  size = "md",
  leadingVisual,
  trailingVisual,
  showCount = false,
  autoGrow = false,
  maxRows,
  wrapperClassName,
  wrapperProps,
  shellRef,
  id,
  className,
  disabled,
  readOnly,
  rows = 3,
  ref,
  onInput,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextAreaProps) {
  const textareaRef = useProvidedRefOrCreate<HTMLTextAreaElement>(ref);
  const { count, onInput: countInput } = useCharacterCount({ enabled: showCount, value: props.value, defaultValue: props.defaultValue, maxLength: props.maxLength });
  const { onInput: growInput } = useAutoGrow({ ref: textareaRef, enabled: autoGrow, value: props.value, maxRows });
  const { controlId, invalid, describedby } = useFieldControl({ id, description, error, count, "aria-describedby": ariaDescribedBy });

  return (
    <InputField
      data-component="TextArea"
      {...wrapperProps}
      label={label}
      labelHelp={labelHelp}
      controlId={controlId}
      description={description}
      descriptionVisual={descriptionVisual}
      error={error}
      errorVisual={errorVisual}
      count={count}
      disabled={disabled}
      className={clsx(wrapperClassName, wrapperProps?.className)}
    >
      <InputField.Shell ref={shellRef} size={size} leadingVisual={leadingVisual} trailingVisual={trailingVisual} invalid={invalid} disabled={disabled} readOnly={readOnly} multiline>
        <textarea
          {...props}
          ref={textareaRef}
          id={controlId}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          data-auto-grow={autoGrow ? "" : undefined}
          className={clsx(classes.TextArea, className)}
          onInput={(event) => {
            onInput?.(event);
            countInput(event);
            if (autoGrow) growInput();
          }}
        />
      </InputField.Shell>
    </InputField>
  );
}
