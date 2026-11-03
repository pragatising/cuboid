import React, { useMemo, useRef } from "react";
import { clsx } from "clsx";
import { useControllableState, useRovingFocus } from "../../../behaviors";
import { mergeProps } from "../../../utils/mergeProps";
import { TabsContext } from "./TabsContext";
import { TabsTab } from "./TabsTab";
import classes from "./Tabs.module.css";

export type TabsProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "defaultValue" | "onChange" | "children"> & {
  /** `Tabs.Tab`s. */
  children: React.ReactNode;
  /** The `value` of the tab that is open (controlled). Pair it with `onValueChange`. */
  value?: string;
  /** The `value` of the tab open at the start, when it is not controlled. */
  defaultValue?: string;
  /** Called with the `value` of the tab the person opened. */
  onValueChange?: (value: string) => void;
};

/**
 * A list of tabs, one of them open (Figma PanelTabList): it switches between panels of content, and is not a `SegmentedControl`, which
 * chooses a value and has a strip behind its items. Here there is no strip: the open tab has a ground of its own and the others are plain
 * text. Name it with `aria-label`. Arrow keys, Home and End move between the tabs (the open one is the one Tab reaches).
 */
export function Tabs({ children, value: valueProp, defaultValue, onValueChange, className, ...props }: TabsProps) {
  const [value, setValue] = useControllableState<string | undefined>({ value: valueProp, defaultValue, onChange: (next) => next !== undefined && onValueChange?.(next), name: "value" });
  const context = useMemo(() => ({ value, select: setValue }), [value, setValue]);
  const list = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useRovingFocus({ containerRef: list, itemSelector: '[role="tab"]', orientation: "horizontal", typeahead: false });

  return (
    <div
      {...mergeProps({ "data-component": "Tabs", role: "tablist", className: clsx(classes.Tabs, className), onKeyDown }, props as object)}
      ref={list}
    >
      <TabsContext.Provider value={context}>{children}</TabsContext.Provider>
    </div>
  );
}

Tabs.Tab = TabsTab;
