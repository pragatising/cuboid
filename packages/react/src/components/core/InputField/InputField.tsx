import React from "react";
import { clsx } from "clsx";
import { isPresent } from "../../../utils/isPresent";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./InputField.module.css";

/** The field's height, radius and icon size: `sm` 24px, `md` 28px, `lg` 32px, the same sizes as Button and IconButton (`size.control`). */
export type InputFieldSize = "sm" | "md" | "lg";

export type InputFieldProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** The field itself: an `InputShell` around a control. */
  children: React.ReactNode;
  /** The visible label. It is tied to the control by `controlId`. */
  label?: React.ReactNode;
  /** The id of the control, so the label, help text and error can point at it. */
  controlId: string;
  /** Help text under the field. */
  description?: React.ReactNode;
  /** The validation message under the field; its presence puts the field in the error state. */
  error?: React.ReactNode;
  /** Whether the control is disabled, for the label. */
  disabled?: boolean;
};

/** The ids of the help text and the error, for the control's `aria-describedby`. */
export function describedBy(controlId: string, { description, error }: { description?: React.ReactNode; error?: React.ReactNode }) {
  return [isPresent(description) ? `${controlId}-description` : null, isPresent(error) ? `${controlId}-error` : null].filter(Boolean).join(" ") || undefined;
}

/**
 * The chrome around a form control: a label above, and help text and a validation message below. `InputText` is built on it;
 * select and textarea use the same chrome around their own control. Its colours and gaps are the `--cube-input-*` variables.
 */
function InputFieldRoot({ children, label, controlId, description, error, disabled, className, ...props }: InputFieldProps) {
  const invalid = isPresent(error);

  return (
    <div
      {...mergeProps(
        {
          "data-component": "InputField",
          "data-invalid": invalid ? "" : undefined,
          "data-disabled": disabled ? "" : undefined,
          className: clsx(classes.InputField, className),
        },
        props as object,
      )}
    >
      {isPresent(label) ? (
        <label htmlFor={controlId} className={classes.Label} data-component="InputField.Label">
          {label}
        </label>
      ) : null}
      {children}
      {isPresent(description) ? (
        <div id={`${controlId}-description`} className={classes.Description} data-component="InputField.Description">
          {description}
        </div>
      ) : null}
      {invalid ? (
        <div id={`${controlId}-error`} className={classes.Error} data-component="InputField.Error">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export type InputShellProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** The control: the native input, select or textarea. It fills the space between the visuals. */
  children: React.ReactNode;
  /** @default "md" */
  size?: InputFieldSize;
  /** A visual before the control, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
  /** A visual after the control. Hidden from assistive technology. */
  trailingVisual?: React.ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** The control is several lines (a textarea): the box grows with it, at least the field's height, and the visuals sit by the first line. */
  multiline?: boolean;
};

/** The bordered box: leading visual, the control, trailing visual. Hover, focus, error, read-only and disabled looks are its CSS. */
function InputShell({ children, size = "md", leadingVisual, trailingVisual, invalid, disabled, readOnly, multiline, className, ...props }: InputShellProps) {
  return (
    <div
      {...mergeProps(
        {
          "data-component": "InputField.Shell",
          "data-size": size,
          "data-invalid": invalid ? "" : undefined,
          "data-disabled": disabled ? "" : undefined,
          "data-readonly": readOnly ? "" : undefined,
          "data-multiline": multiline ? "" : undefined,
          className: clsx(classes.Shell, className),
        },
        props as object,
      )}
    >
      {isPresent(leadingVisual) ? (
        <span className={classes.Visual} aria-hidden="true" data-component="InputField.LeadingVisual">
          {leadingVisual}
        </span>
      ) : null}
      {children}
      {isPresent(trailingVisual) ? (
        <span className={classes.Visual} aria-hidden="true" data-component="InputField.TrailingVisual">
          {trailingVisual}
        </span>
      ) : null}
    </div>
  );
}

/** The chrome around a form control, with the bordered box as `InputField.Shell`. */
export const InputField = Object.assign(InputFieldRoot, { Shell: InputShell });
