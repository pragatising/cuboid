import React from "react";
import { clsx } from "clsx";
import { mergeProps } from "../../../utils/mergeProps";
import { Spinner } from "../Button/Spinner";
import { Text } from "../Text";
import classes from "./ActionListLoading.module.css";

export type ActionListLoadingProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** What it says beside the spinner. @default "Loading…" */
  children?: React.ReactNode;
};

/**
 * A row for a list whose options are on their way: a spinner and a word. It is not announced by itself (it is not a live region):
 * the combobox that shows it announces "loading" through `useCombobox`, so it is said once and not on every render. It goes outside
 * the `role="listbox"`, above it.
 */
export function ActionListLoading({ children = "Loading…", className, ...props }: ActionListLoadingProps) {
  return (
    <div {...mergeProps({ "data-component": "ActionList.Loading", className: clsx(classes.Loading, className) }, props as object)}>
      <Spinner />
      <Text as="span" size="md" color="neutral.muted">
        {children}
      </Text>
    </div>
  );
}
