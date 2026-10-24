import React, { Children, isValidElement, useMemo } from "react";
import { useControllableState, useProvidedRefOrCreate } from "../../../behaviors";
import { ActionList, ActiveOptionContext, useCombobox } from "../ActionList";
import { Icon } from "../Icon";
import { InputField, useFieldControl } from "../InputField";
import type { InputFieldProps, InputFieldSize } from "../InputField";
import { clsx } from "clsx";
import { Popover } from "../Popover";
import type { PopoverProps } from "../Popover";
import classes from "./Select.module.css";
import { NativeSelect } from "./SelectNative";
import { SelectContext, SelectOption } from "./SelectOption";

export type { SelectOptionProps } from "./SelectOption";

export type SelectProps = Omit<React.ComponentPropsWithRef<"button">, "children" | "value" | "defaultValue" | "onChange" | "color" | "type" | "role" | "name"> &
  Pick<InputFieldProps, "labelHelp" | "descriptionVisual" | "errorVisual"> & {
  /** The visible label, tied to the select. Without one, give it an `aria-label`. */
  label?: React.ReactNode;
  /** Help text under the field. */
  description?: React.ReactNode;
  /** The validation message under the field. Its presence puts the field in the error state and sets `aria-invalid`. */
  error?: React.ReactNode;
  /** Merged onto the outer wrapper (label, field, help text); `className` and `style` go to the select's box. */
  wrapperClassName?: string;
  /** `Select.Option`s, with optional `Select.Section`s. */
  children: React.ReactNode;
  /** The chosen option's `value`. Leave unset to let the select keep it. */
  value?: string;
  /** The initial value when it keeps its own. @default "" (nothing chosen) */
  defaultValue?: string;
  /** Called with the new value when the user chooses an option. */
  onValueChange?: (value: string) => void;
  /** Whether the options are showing. Leave unset to let the select open and close them. */
  open?: boolean;
  /** The initial state when it keeps its own. @default false */
  defaultOpen?: boolean;
  /** Called when the select wants the options shown or hidden. */
  onOpenChange?: (open: boolean) => void;
  /** The options are on their way: a loading row shows above the list, and a screen reader is told once. @default false */
  loading?: boolean;
  /** What the loading row says. @default "Loading…" */
  loadingText?: string;
  /** Render a real `<select>` (the same field around it) so a phone or tablet shows its own picker. Options become text (`description`, visuals, `loading` and the popup props do not apply). It is chosen per use, not switched automatically. @default false */
  native?: boolean;
  /** Shown when nothing is chosen. */
  placeholder?: string;
  /** The field's height: `sm` 24px, `md` 28px, `lg` 32px (as Button). @default "md" */
  size?: InputFieldSize;
  /** A visual before the value, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
  /** Makes the select a field of a form: the chosen value is submitted under this name. */
  name?: string;
  id?: string;
  disabled?: boolean;
  /** The value shows, but the options cannot be opened. */
  readOnly?: boolean;
  /** Names the select when there is no visible `label`. */
  "aria-label"?: string;
  /** Caps the list's height (any CSS length); the options scroll inside it. */
  maxHeight?: PopoverProps["maxHeight"];
};

/** The label of the option with this value: what the closed select shows. Looks inside sections. */
function labelOf(children: React.ReactNode, value: string): React.ReactNode | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { value?: unknown; children?: React.ReactNode };
    if (child.type === SelectOption) {
      if (props.value === value) return props.children;
    } else if (props.children !== undefined) {
      const found = labelOf(props.children, value);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * A field that chooses one of several options (`Select.Option` as direct children, inside a `Select.Section` or a fragment: the closed
 * box finds the chosen label by looking at them, so an option wrapped in your own component is not found): the label, the box showing the chosen option (or a placeholder) with a chevron,
 * and help text or an error under it, as `InputText` has. Like a native `<select>`, `className`, `style`, `aria-*` and `ref` go
 * to the box that holds focus (ADR-05). The options open in a popup under it, the same rows an `ActionMenu`
 * uses.
 *
 * It is the select-only combobox pattern (`useCombobox`, `kind: "select"`): the box is a focusable `role="combobox"` that keeps
 * focus while the popup is open, and points at the active option with `aria-activedescendant`. ArrowDown, ArrowUp, Enter and
 * Space open it; the arrows, Home and End, and typing a word move, Enter or Space chooses, Escape and Tab close, and so does focus
 * leaving for outside the popup. A pointer press on an option chooses it.
 */
function PopupSelect({
  children,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  loading = false,
  loadingText,
  placeholder,
  size = "md",
  leadingVisual,
  name,
  id,
  label,
  labelHelp,
  description,
  descriptionVisual,
  error,
  errorVisual,
  disabled,
  readOnly,
  maxHeight,
  native: _native,
  className,
  wrapperClassName,
  ref,
  onClick,
  onKeyDown,
  onKeyUp,
  onBlur,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SelectProps) {
  const buttonRef = useProvidedRefOrCreate<HTMLButtonElement>(ref);
  const { controlId, invalid, describedby } = useFieldControl({ id, description, error, "aria-describedby": ariaDescribedBy });
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange, name: "value" });
  const chosen = value === "" ? undefined : labelOf(children, value);

  const combobox = useCombobox({
    kind: "select",
    open,
    defaultOpen,
    onOpenChange,
    disabled: disabled || readOnly,
    loading,
    controlRef: buttonRef,
    onChoose: (option) => setValue(option.dataset.value ?? ""),
  });
  const selectContext = useMemo(() => ({ value }), [value]);

  return (
    <SelectContext.Provider value={selectContext}>
      <ActiveOptionContext.Provider value={combobox.activeOption}>
        <Popover
          {...combobox.popoverProps}
          maxHeight={maxHeight}
          trigger={
            <InputField data-component="Select" label={label} labelHelp={labelHelp} controlId={controlId} description={description} descriptionVisual={descriptionVisual} error={error} errorVisual={errorVisual} disabled={disabled} className={wrapperClassName}>
              <InputField.Shell ref={combobox.anchorRef} size={size} leadingVisual={leadingVisual} trailingVisual={<Icon name="keyboard_arrow_down" />} invalid={invalid} disabled={disabled} readOnly={readOnly}>
                <button
                  {...props}
                  {...combobox.controlProps}
                  ref={buttonRef}
                  id={controlId}
                  type="button"
                  disabled={disabled}
                  aria-label={label ? undefined : ariaLabel}
                  aria-readonly={readOnly || undefined}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedby}
                  className={clsx(classes.Control, className)}
                  data-placeholder={chosen === undefined ? "" : undefined}
                  onClick={(event) => {
                    onClick?.(event);
                    if (!event.defaultPrevented && !disabled && !readOnly) combobox.setOpen((now) => !now);
                  }}
                  onKeyDown={(event) => {
                    onKeyDown?.(event);
                    combobox.controlProps.onKeyDown(event);
                  }}
                  onBlur={(event) => {
                    onBlur?.(event);
                    combobox.controlProps.onBlur(event);
                  }}
                  onKeyUp={(event) => {
                    onKeyUp?.(event);
                    if (event.key === " ") event.preventDefault();
                  }}
                >
                  {chosen ?? placeholder ?? ""}
                </button>
                {name ? <input type="hidden" name={name} value={value} disabled={disabled} /> : null}
              </InputField.Shell>
            </InputField>
          }
        >
          {loading ? <ActionList.Loading>{loadingText}</ActionList.Loading> : null}
          <ActionList {...combobox.listProps} data-component="Select.List" aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)} aria-busy={loading || undefined} hidden={(loading && Children.toArray(children).length === 0) || undefined}>
            {children}
          </ActionList>
        </Popover>
      </ActiveOptionContext.Provider>
    </SelectContext.Provider>
  );
}

/** The select: the popup one, or with `native` a real `<select>` in the same field. They are different components, so toggling `native` remounts. */
function SelectRoot(props: SelectProps) {
  return props.native ? <NativeSelect {...props} /> : <PopupSelect {...props} />;
}

export const Select = Object.assign(SelectRoot, {
  Option: SelectOption,
  Section: ActionList.Section,
});
