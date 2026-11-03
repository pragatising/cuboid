import React from "react";
import { clsx } from "clsx";
import { useActiveDescendant } from "../../../behaviors";
import { Icon } from "../Icon";
import { InputText } from "../InputText";
import type { InputTextProps } from "../InputText";
import { useActiveOptionContext } from "../ActionList/ActiveOptionContext";
import classes from "./ActionMenuSearch.module.css";

export type ActionMenuSearchProps = Omit<InputTextProps, "label" | "description" | "error" | "role" | "size" | "leadingVisual" | "wrapperClassName"> & {
  /** What the field is for. There is no visible label, so this is its accessible name. */
  "aria-label": string;
  /** Focus the field when the menu opens. @default true */
  autoFocus?: boolean;
};

/**
 * The search field of an `ActionMenu`, under the header. Typing is the consumer's to handle (`value` and `onChange`, then render
 * the matching items): the menu does not filter. The field is a combobox that keeps focus while the list below it is a
 * `listbox`: ArrowUp and ArrowDown move the active option (`aria-activedescendant`), Enter chooses it, and the first option is
 * active whenever the list changes (`useActiveDescendant`). It sits outside the list, so it is never read as one of its options.
 */
export function ActionMenuSearch({ className, autoFocus = true, onKeyDown, ...props }: ActionMenuSearchProps) {
  const search = useActiveOptionContext();
  const { onKeyDown: navigate } = useActiveDescendant({ listId: search?.listId, activeId: search?.activeId, setActiveId: search?.setActiveId, enabled: search !== null });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    navigate(event);
  };

  return (
    <div className={clsx(classes.Search, className)} data-component="ActionMenu.Search">
      <InputText
        {...props}
        type="search"
        role="combobox"
        autoComplete="off"
        autoFocus={autoFocus}
        leadingVisual={<Icon name="search" />}
        aria-expanded
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={search?.listId}
        aria-activedescendant={search?.activeId}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
