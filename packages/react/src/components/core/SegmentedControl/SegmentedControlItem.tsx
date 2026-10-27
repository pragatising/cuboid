import React from "react";
import { clsx } from "clsx";
import { ButtonBase } from "../Button";
import type { ButtonProps } from "../Button";
import { useSegmentedControlContext } from "./SegmentedControlContext";
import classes from "./SegmentedControl.module.css";

export type SegmentedControlItemProps = Omit<ButtonProps, "variant" | "size" | "block" | "loading" | "loadingMessage" | "alignContent" | "value" | "type"> & {
  /** What the control's `value` becomes when this item is chosen. Unique within the control. */
  value: string;
};

/**
 * One choice of a `SegmentedControl`: a button with a label and, optionally, a leading and a trailing visual (an icon-only
 * item needs an `aria-label`). The chosen one is a `secondary` Button and the others are `ghost`, so it carries the Button's
 * anatomy; `aria-pressed` says which is chosen.
 */
export function SegmentedControlItem({ value, className, onClick, disabled, children, ...props }: SegmentedControlItemProps) {
  const { value: current, select, size } = useSegmentedControlContext();
  const selected = current === value;

  return (
    <ButtonBase
      data-component="SegmentedControl.Item"
      {...props}
      variant={selected ? "secondary" : "ghost"}
      size={size}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(classes.Item, className)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !selected) select(value);
      }}
    >
      {children}
    </ButtonBase>
  );
}
