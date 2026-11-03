import React, { useMemo, useState } from "react";
import { useControllableState } from "../../../behaviors";
import { isCssColor } from "../../../utils/colorPaths";
import { needsOutline } from "../../../utils/outline";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { Popover } from "../Popover";
import { ColorPanel } from "./ColorPanel";
import type { ColorPanelProps } from "./ColorPanel";
import classes from "./ColorPicker.module.css";

export type { Swatch, SwatchGroup } from "./SwatchGrid";

export type ColorPickerProps = Omit<ColorPanelProps, "ref" | "role" | "defaultValue"> &
  Omit<React.ComponentPropsWithRef<"button">, keyof ColorPanelProps | "children" | "role"> & {
    /** What is chosen at the start, when it is not controlled. */
    defaultValue?: string;
    /** What the button says while nothing is chosen. @default "Choose a colour" */
    placeholder?: string;
    /** The button that opens the panel, when the default does not fit (it needs a `ref` and an `onClick`: a `Button`, or a button). */
    trigger?: React.ReactElement;
  };

/**
 * A colour field: a button that shows the colour chosen and opens a `ColorPanel` to choose one: swatches (with a search field for a long
 * palette, a row of "None"), a Custom side with a gradient and hue slider when any colour may be chosen, and a Border switch for a surface.
 * A swatch closes the panel; moving over the gradient or typing a hex does not, because it is not one choice. Where the panel belongs in the
 * page and not behind a button, use `ColorPanel`. It knows no tokens: each swatch is given the CSS colour it is drawn in.
 */
export function ColorPicker({
  groups,
  value: valueProp,
  defaultValue,
  onValueChange,
  placeholder = "Choose a colour",
  trigger,
  "aria-label": ariaLabel,
  // The panel's own props, and then whatever goes to the button.
  custom,
  bordered,
  onBorderedChange,
  clearable,
  appearance,
  columns,
  showLabels,
  searchable,
  className,
  ...props
}: ColorPickerProps) {
  const [value, setValue] = useControllableState<string | undefined>({ value: valueProp, defaultValue, onChange: onValueChange, name: "value" });
  const [open, setOpen] = useState(false);

  const all = useMemo(() => groups.flatMap((group) => group.swatches), [groups]);
  const chosen = all.find((swatch) => swatch.value === value);
  const chosenColor = chosen?.color ?? (value && isCssColor(value) ? value : undefined);

  const choose = (next: string | undefined) => {
    setValue(next);
    // A swatch (or None) is a choice and closes the panel; a colour from the gradient is still being chosen.
    if (next === undefined || all.some((swatch) => swatch.value === next)) setOpen(false);
  };

  const button = trigger ?? (
    <Button
      variant="secondary"
      size="sm"
      aria-label={`${ariaLabel}: ${value ?? "none"}`}
      leadingVisual={<span className={classes.Dot} data-empty={chosenColor ? undefined : ""} data-outline={chosenColor && needsOutline(chosenColor) ? "" : undefined} style={chosenColor ? ({ "--swatch": chosenColor } as React.CSSProperties) : undefined} />}
      trailingVisual={<Icon name="keyboard_arrow_down" size="xs" aria-hidden="true" />}
      {...(props as object)}
    >
      {value ?? placeholder}
    </Button>
  );

  return (
    <Popover trigger={button} open={open} onOpenChange={setOpen} role="dialog" aria-label={ariaLabel} placement="bottom-start" maxHeight="28rem">
      <ColorPanel
        data-component="ColorPicker"
        className={[classes.Panel, className].filter(Boolean).join(" ")}
        aria-label={ariaLabel}
        groups={groups}
        value={value}
        onValueChange={choose}
        custom={custom}
        bordered={bordered}
        onBorderedChange={onBorderedChange}
        clearable={clearable}
        appearance={appearance}
        columns={columns}
        showLabels={showLabels}
        searchable={searchable}
      />
    </Popover>
  );
}
