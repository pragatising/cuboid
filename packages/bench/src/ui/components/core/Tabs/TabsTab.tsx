import React from "react";
import { clsx } from "clsx";
import { useTabsContext } from "./TabsContext";
import classes from "./Tabs.module.css";

export type TabsTabProps = Omit<React.ComponentPropsWithRef<"button">, "role" | "value" | "type"> & {
  /** What the list's `value` becomes when this tab is opened. Unique within the list. */
  value: string;
  /** A visual before the label, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
};

/**
 * One tab of a `Tabs` list (Figma Tab.Primary): its label, and optionally an icon before it. The one that is open has a ground; the
 * others are plain text, a step darker under the pointer. Only the open tab is reached with Tab; the arrow keys move between them.
 */
export function TabsTab({ value, leadingVisual, className, onClick, children, ...props }: TabsTabProps) {
  const { value: current, select } = useTabsContext();
  const open = current === value;
  return (
    <button
      type="button"
      data-component="Tabs.Tab"
      {...props}
      role="tab"
      aria-selected={open}
      tabIndex={open ? 0 : -1}
      data-value={value}
      className={clsx(classes.Tab, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) select(value);
      }}
    >
      {leadingVisual ? (
        <span className={classes.Visual} aria-hidden="true">
          {leadingVisual}
        </span>
      ) : null}
      {children}
    </button>
  );
}
