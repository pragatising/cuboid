import React, { Children } from "react";
import { useProvidedRefOrCreate } from "../../../behaviors";
import { isPresent } from "../../../utils/isPresent";
import { ActionList, ActionListItem, ActiveOptionContext, useCombobox } from "../ActionList";
import type { ActionListItemProps } from "../ActionList";
import { InputText } from "../InputText";
import type { InputTextProps } from "../InputText";
import { Popover } from "../Popover";
import type { PopoverProps } from "../Popover";

export type AutocompleteProps = Omit<InputTextProps, "role" | "children" | "onSelect"> & {
  /** The suggestions: `Autocomplete.Item`s, with optional `Autocomplete.Section`s. Render only the ones that match the text. */
  children?: React.ReactNode;
  /** Called with the item that was chosen, by click or Enter. Put its text in the field here. */
  onSelect?: (item: HTMLElement) => void;
  /** Shown in the list while there is nothing to suggest, usually an `EmptyState`. Without it the list is not shown when empty. */
  empty?: React.ReactNode;
  /** Suggestions are on their way: a loading row shows above the list (or alone, with none yet), and a screen reader is told once. @default false */
  loading?: boolean;
  /** What the loading row says. @default "Loading…" */
  loadingText?: string;
  /** Show the suggestions whenever the field is focused, not only once the user types. @default true */
  openOnFocus?: boolean;
  /** Whether the suggestions are showing. Leave unset to let the field open and close them. */
  open?: boolean;
  /** The initial state when it keeps its own. @default false */
  defaultOpen?: boolean;
  /** Called when the field wants the suggestions shown or hidden. */
  onOpenChange?: (open: boolean) => void;
  /** Caps the suggestions' height (any CSS length); they scroll inside it. */
  maxHeight?: PopoverProps["maxHeight"];
};

/** One suggestion of an `Autocomplete`. It is an `ActionMenu.Item`: it takes the same leading visual, description and `disabled`. */
function AutocompleteItem(props: ActionListItemProps) {
  return <ActionListItem data-component="Autocomplete.Item" {...props} />;
}

/**
 * A text field with a list of suggestions under it. The text is the consumer's (`value` and `onChange`): render the
 * `Autocomplete.Item`s that match it, and put the chosen item's text in the field from `onSelect`.
 *
 * It is the combobox pattern (`useCombobox`, `kind: "input"`): the field is a combobox and keeps focus the whole time; the
 * suggestions are a `listbox`, and ArrowUp and ArrowDown move the active one (`aria-activedescendant`), Enter chooses it,
 * Escape hides the list, and Tab or focus leaving for outside the popup closes it. It tells a screen reader how many
 * suggestions there are once typing pauses (so give `empty` no `role="status"`). With nothing to suggest the list is not shown, unless there is an `empty` state to
 * show in its place, and `loading` puts a loading row above the list. A "create new" row is just an item you render when nothing
 * matches exactly: `<Autocomplete.Item leadingVisual={<Icon name="add" />}>Create “{value}”</Autocomplete.Item>`. The rows are the same
 * ones an `ActionMenu` uses.
 */
function AutocompleteRoot({
  children,
  onSelect,
  empty,
  loading = false,
  loadingText,
  openOnFocus = true,
  open,
  defaultOpen,
  onOpenChange,
  maxHeight,
  ref,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: AutocompleteProps) {
  const inputRef = useProvidedRefOrCreate<HTMLInputElement>(ref);

  // `toArray` drops null, undefined and booleans: `Children.count` would count `{cond && <Item />}` that rendered nothing.
  const hasItems = Children.toArray(children).length > 0;
  const showEmpty = !hasItems && !loading && isPresent(empty);

  const combobox = useCombobox({ kind: "input", open, defaultOpen, onOpenChange, hasContent: hasItems || showEmpty || loading, loading, loadingMessage: loadingText?.replace(/…$/, "") || "Loading", controlRef: inputRef, onChoose: (item) => onSelect?.(item) });

  const name = props["aria-label"] ?? (typeof props.label === "string" ? props.label : undefined);

  return (
    <ActiveOptionContext.Provider value={combobox.activeOption}>
      <Popover
        {...combobox.popoverProps}
        maxHeight={maxHeight}
        trigger={
          <InputText
            {...props}
            {...combobox.controlProps}
            wrapperProps={{ ...props.wrapperProps, "data-component": "Autocomplete" } as React.ComponentProps<typeof InputText>["wrapperProps"]}
            ref={inputRef}
            shellRef={combobox.anchorRef}
            autoComplete="off"
            aria-autocomplete="list"
            onChange={(event) => {
              onChange?.(event);
              combobox.setOpen(true);
            }}
            onFocus={(event) => {
              onFocus?.(event);
              if (openOnFocus) combobox.setOpen(true);
            }}
            onBlur={(event) => {
              onBlur?.(event);
              combobox.controlProps.onBlur(event);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              combobox.controlProps.onKeyDown(event);
            }}
          />
        }
      >
        {loading ? <ActionList.Loading>{loadingText}</ActionList.Loading> : null}
        {showEmpty ? empty : null}
        {/* Hidden, not removed, while there is only a loading row or the empty state, so the field's aria-controls still points at something. */}
        <ActionList {...combobox.listProps} data-component="Autocomplete.List" aria-label={name} aria-busy={loading || undefined} hidden={!hasItems || undefined}>
          {children}
        </ActionList>
      </Popover>
    </ActiveOptionContext.Provider>
  );
}

export const Autocomplete = Object.assign(AutocompleteRoot, {
  Item: AutocompleteItem,
  Section: ActionList.Section,
});
