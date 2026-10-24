import React, { createContext, useContext } from "react";
import { ActionListItem } from "../ActionList";
import type { ActionListItemProps } from "../ActionList";

/** The chosen value, for each `Select.Option` to know whether it is the chosen one. */
export const SelectContext = createContext<{ value: string }>({ value: "" });

export type SelectOptionProps = Omit<ActionListItemProps, "selected" | "value"> & {
  /** What the select's value is when this option is chosen. */
  value: string;
};

/** One choice of a `Select`. It is an `ActionMenu.Item`: it takes the same leading visual, description and `disabled`. */
export function SelectOption({ value, ...props }: SelectOptionProps) {
  const { value: current } = useContext(SelectContext);
  return <ActionListItem data-component="Select.Option" {...props} selected={current === value} data-value={value} />;
}
