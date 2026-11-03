import React from "react";
import { clsx } from "clsx";
import { useControllableState } from "../../../behaviors";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Switch.module.css";

export type SwitchProps = Omit<React.ComponentPropsWithRef<"input">, "type" | "role" | "size" | "color" | "children"> & {
  /** The visible label, before the switch. Without one, give the switch an `aria-label`. */
  label?: React.ReactNode;
  /** Whether the switch is on (controlled). Pair it with `onCheckedChange`. */
  checked?: boolean;
  /** Whether the switch starts on, when it is not controlled. @default false */
  defaultChecked?: boolean;
  /** Called with the new state when the person turns it on or off. */
  onCheckedChange?: (checked: boolean) => void;
  /** Merged onto the outer label element; `className` and `style` go to the switch itself. */
  wrapperClassName?: string;
  /** Other attributes for the outer label element (`data-*`, `id`…): they go there, not to the switch. */
  wrapperProps?: Omit<React.ComponentPropsWithoutRef<"label">, "children">;
};

/**
 * An on/off control: a label and a track with a thumb. It is a native `<input type="checkbox" role="switch">`, so it is
 * focusable, answers Space, takes part in a form (`name`, `value`) and is announced as a switch. Like a native input,
 * everything that is not its own chrome goes to the input: `className`, `style`, `name`, `disabled`, `aria-*`…, and `ref`
 * points at it (ADR-05). `readOnly` keeps it focusable but ignores a press.
 *
 * It is not a field: it has no help text or error of its own. Its look is the `switch` tokens, read in CSS.
 */
export function Switch({ label, checked: checkedProp, defaultChecked = false, onCheckedChange, wrapperClassName, wrapperProps, className, disabled, readOnly, onChange, ...props }: SwitchProps) {
  const [checked, setChecked] = useControllableState({ value: checkedProp, defaultValue: defaultChecked, onChange: onCheckedChange, name: "checked" });

  return (
    <label
      {...mergeProps({ "data-component": "Switch", "data-disabled": disabled ? "" : undefined, className: clsx(classes.Switch, wrapperClassName) }, (wrapperProps ?? {}) as object)}
    >
      {label !== undefined && label !== null && label !== false ? (
        <span data-component="Switch.Label" className={classes.Label}>
          {label}
        </span>
      ) : null}
      <input
        data-component="Switch.Control"
        {...props}
        type="checkbox"
        role="switch"
        className={clsx(classes.Control, className)}
        checked={checked}
        disabled={disabled}
        aria-readonly={readOnly || undefined}
        onChange={(event) => {
          // A read-only switch cannot be turned: the state does not change, so React puts the box back as it was.
          if (readOnly) return;
          setChecked(event.target.checked);
          onChange?.(event);
        }}
      />
    </label>
  );
}
