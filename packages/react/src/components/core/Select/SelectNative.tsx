import React, { Children, isValidElement } from "react";
import { clsx } from "clsx";
import { useControllableState } from "../../../behaviors";
import { ActionList } from "../ActionList";
import { Icon } from "../Icon";
import { InputField, useFieldControl } from "../InputField";
import classes from "./Select.module.css";
import type { SelectProps } from "./Select";
import { SelectOption } from "./SelectOption";

type NativeOption = { kind: "option"; value: string; label: string; disabled: boolean };
type NativeEntry = NativeOption | { kind: "group"; label: string; options: NativeOption[] };

/** The text of a node, for an `<option>`, which holds text only. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
}

/** The `Select.Option`s and `Select.Section`s in `children` as native options and option groups, looking through fragments. */
function collect(children: React.ReactNode): NativeEntry[] {
  const entries: NativeEntry[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { value?: string; label?: React.ReactNode; disabled?: boolean; children?: React.ReactNode };
    if (child.type === SelectOption) {
      entries.push({ kind: "option", value: props.value ?? "", label: textOf(props.children), disabled: Boolean(props.disabled) });
    } else if (child.type === ActionList.Section) {
      entries.push({ kind: "group", label: textOf(props.label), options: collect(props.children).filter((entry): entry is NativeOption => entry.kind === "option") });
    } else if (props.children !== undefined) {
      entries.push(...collect(props.children));
    }
  }
  return entries;
}

const renderOption = (option: NativeOption) => (
  <option key={option.value} value={option.value} disabled={option.disabled}>
    {option.label}
  </option>
);

/**
 * `Select` with `native`: the same field (label, box, chevron, help text, error) around a real `<select>`, so a phone or tablet
 * shows its own picker. Options are read from the `Select.Option`s and `Select.Section`s, as text (an `<option>` holds nothing
 * else); `description`, visuals, `loading` and the popup props do not apply. Choose it per use (for example from a media query in
 * the app): it is not switched automatically, so the server and the first client render agree.
 */
export function NativeSelect({
  children,
  value: valueProp,
  defaultValue = "",
  onValueChange,
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
  loading,
  className,
  wrapperClassName,
  ref,
  onKeyDown,
  onMouseDown,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  // popup-only: no meaning for a native select
  open: _open,
  defaultOpen: _defaultOpen,
  onOpenChange: _onOpenChange,
  loadingText: _loadingText,
  maxHeight: _maxHeight,
  native: _native,
  ...props
}: SelectProps) {
  const { controlId, invalid, describedby } = useFieldControl({ id, description, error, "aria-describedby": ariaDescribedBy });
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange, name: "value" });
  const entries = collect(children);
  // The rest props are typed for the popup select's button; a native select takes the same ones that mean the same thing.
  const selectProps = props as unknown as React.ComponentPropsWithoutRef<"select">;

  return (
    <InputField data-component="Select" label={label} labelHelp={labelHelp} controlId={controlId} description={description} descriptionVisual={descriptionVisual} error={error} errorVisual={errorVisual} disabled={disabled} className={wrapperClassName}>
      <InputField.Shell size={size} leadingVisual={leadingVisual} trailingVisual={<Icon name="keyboard_arrow_down" />} invalid={invalid} disabled={disabled} readOnly={readOnly}>
        <select
          {...selectProps}
          ref={ref as unknown as React.Ref<HTMLSelectElement>}
          id={controlId}
          name={name}
          value={value}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          aria-readonly={readOnly || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          aria-busy={loading || undefined}
          className={clsx(classes.Native, className)}
          data-placeholder={value === "" ? "" : undefined}
          onChange={(event) => setValue(event.target.value)}
          // A native select has no read-only: the picker is kept from opening.
          onMouseDown={(event) => {
            (onMouseDown as React.MouseEventHandler<HTMLSelectElement> | undefined)?.(event);
            if (readOnly) event.preventDefault();
          }}
          onKeyDown={(event) => {
            (onKeyDown as React.KeyboardEventHandler<HTMLSelectElement> | undefined)?.(event);
            if (readOnly && event.key !== "Tab") event.preventDefault();
          }}
        >
          {placeholder !== undefined || value === "" ? (
            <option value="" disabled>
              {placeholder ?? ""}
            </option>
          ) : null}
          {entries.map((entry) =>
            entry.kind === "group" ? (
              <optgroup key={entry.label} label={entry.label}>
                {entry.options.map(renderOption)}
              </optgroup>
            ) : (
              renderOption(entry)
            ),
          )}
        </select>
      </InputField.Shell>
    </InputField>
  );
}
