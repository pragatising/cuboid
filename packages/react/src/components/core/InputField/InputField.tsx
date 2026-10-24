import React from "react";
import { clsx } from "clsx";
import { isPresent } from "../../../utils/isPresent";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import { Tooltip } from "../Tooltip";
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
  /** An info icon after the label that explains the field in a tooltip, on hover and keyboard focus. */
  labelHelp?: string;
  /** A visual before the help text, usually an `Icon`. Hidden from assistive technology. */
  descriptionVisual?: React.ReactNode;
  /** A visual before the error, usually an `Icon`. Hidden from assistive technology. */
  errorVisual?: React.ReactNode;
  /** A line under the field, for example `12 / 100`. It is read with the help text when the control is focused. */
  count?: React.ReactNode;
};

/** The ids of the help text, the error and the count, for the control's `aria-describedby`. */
export function describedBy(controlId: string, { description, error, count }: { description?: React.ReactNode; error?: React.ReactNode; count?: React.ReactNode }) {
  return (
    [isPresent(description) ? `${controlId}-description` : null, isPresent(error) ? `${controlId}-error` : null, isPresent(count) ? `${controlId}-count` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

/**
 * The chrome around a form control: a label above, and help text and a validation message below. `InputText` is built on it;
 * select and textarea use the same chrome around their own control. Its colours and gaps are the `--cube-input-*` variables.
 */
function InputFieldRoot({ children, label, controlId, description, error, disabled, labelHelp, descriptionVisual, errorVisual, count, className, ...props }: InputFieldProps) {
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
        <div className={classes.LabelRow}>
          <label htmlFor={controlId} className={classes.Label} data-component="InputField.Label">
            {label}
          </label>
          {isPresent(labelHelp) ? (
            <Tooltip text={labelHelp as string}>
              <button type="button" className={classes.LabelHelp} aria-label={typeof label === "string" ? `More about ${label}` : "More information"} data-component="InputField.LabelHelp">
                <Icon name="info" size="xs" />
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      {children}
      {isPresent(description) ? (
        <div id={`${controlId}-description`} className={clsx(classes.Description, classes.Assistive)} data-component="InputField.Description">
          {isPresent(descriptionVisual) ? (
            <span className={classes.AssistiveVisual} aria-hidden="true">
              {descriptionVisual}
            </span>
          ) : null}
          {description}
        </div>
      ) : null}
      {invalid ? (
        <div id={`${controlId}-error`} className={clsx(classes.Error, classes.Assistive)} data-component="InputField.Error">
          {isPresent(errorVisual) ? (
            <span className={classes.AssistiveVisual} aria-hidden="true">
              {errorVisual}
            </span>
          ) : null}
          {error}
        </div>
      ) : null}
      {isPresent(count) ? (
        <div id={`${controlId}-count`} className={classes.Count} data-component="InputField.Count">
          {count}
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
