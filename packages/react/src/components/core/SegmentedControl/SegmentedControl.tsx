import React, { useMemo } from "react";
import { clsx } from "clsx";
import { useControllableState } from "../../../behaviors";
import { mergeProps } from "../../../utils/mergeProps";
import { SegmentedControlContext } from "./SegmentedControlContext";
import { SegmentedControlItem } from "./SegmentedControlItem";
import classes from "./SegmentedControl.module.css";

export type SegmentedControlProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "defaultValue" | "onChange" | "children"> & {
  /** `SegmentedControl.Item`s. */
  children: React.ReactNode;
  /** The `value` of the chosen item (controlled). Pair it with `onValueChange`. */
  value?: string;
  /** The `value` of the item chosen at the start, when it is not controlled. With neither, no item is chosen. */
  defaultValue?: string;
  /** Called with the `value` of the item the person chose. */
  onValueChange?: (value: string) => void;
  /** The height of every item, as Button's: `sm` 24px, `md` 28px, `lg` 32px. @default "sm" */
  size?: "sm" | "md" | "lg";
};

/**
 * A strip of buttons of which one is chosen: a choice of value or of view. It is not a `ButtonGroup`, whose buttons are
 * independent actions; here pressing one unchooses the others. Name it with `aria-label` or `aria-labelledby`. Each item is a
 * button that reports `aria-pressed` and is reached with Tab. (Switching between panels of content is a `Tabs`, which
 * Cuboid does not have yet.)
 */
export function SegmentedControl({ children, value: valueProp, defaultValue, onValueChange, size = "sm", className, ...props }: SegmentedControlProps) {
  const [value, setValue] = useControllableState<string | undefined>({ value: valueProp, defaultValue, onChange: (next) => next !== undefined && onValueChange?.(next), name: "value" });
  const context = useMemo(() => ({ value, select: setValue, size }), [value, setValue, size]);

  return (
    <div {...mergeProps({ "data-component": "SegmentedControl", role: "group", className: clsx(classes.SegmentedControl, className) }, props as object)}>
      <SegmentedControlContext.Provider value={context}>{children}</SegmentedControlContext.Provider>
    </div>
  );
}

SegmentedControl.Item = SegmentedControlItem;
