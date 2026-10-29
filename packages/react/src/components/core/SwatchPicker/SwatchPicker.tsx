import React, { useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { useControllableState } from "../../../behaviors";
import { isCssColor } from "../../../utils/colorPaths";
import { needsOutline } from "../../../utils/outline";
import { mergeProps } from "../../../utils/mergeProps";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { InputText } from "../InputText";
import { Popover } from "../Popover";
import { Text } from "../Text";
import classes from "./SwatchPicker.module.css";

/** One colour to choose: what it is called in code, and the CSS colour it is drawn in. */
export type Swatch = {
  /** What is chosen and reported: a token path (`"neutral.muted"`), a palette name (`"indigo.5"`), a CSS colour. */
  value: string;
  /** How it looks, as CSS (`"#6f6f6d"`): the caller resolves a token to its colour, so the picker knows no tokens. */
  color: string;
  /** What it is called to a person, when `value` is not it. */
  label?: string;
};

/** A row of swatches under a heading: a scale, a family, a purpose. */
export type SwatchGroup = { label: string; swatches: Swatch[] };

export type SwatchPickerProps = Omit<React.ComponentPropsWithRef<"button">, "value" | "defaultValue" | "onChange" | "children" | "color" | "role"> & {
  /** The colours to choose from, in groups. */
  groups: SwatchGroup[];
  /** The `value` of the swatch chosen (controlled), or a CSS colour typed in. Pair it with `onValueChange`. */
  value?: string;
  /** What is chosen at the start, when it is not controlled. */
  defaultValue?: string;
  /** Called with the `value` chosen, or `undefined` when it is cleared. */
  onValueChange?: (value: string | undefined) => void;
  /** Add a field to the panel that takes any CSS colour typed in (`#ff0000`, `rgb(…)`): a swatch is a shortcut, not a fence. @default false */
  allowCustom?: boolean;
  /** Add "None", to clear the choice. @default false */
  clearable?: boolean;
  /** What the button says while nothing is chosen. @default "Choose a colour" */
  placeholder?: string;
  /** The button that opens the panel, when the default does not fit (it needs a `ref` and an `onClick`: a `Button`, or a button). */
  trigger?: React.ReactElement;
  /** Names the panel, and the button. */
  "aria-label": string;
};

/** More swatches than this get a search field. */
const SEARCHABLE = 12;

/**
 * A colour field: a button that shows the colour chosen and opens a panel of swatches in groups, to choose one from. A long palette has a
 * search field, and with `allowCustom` the same field takes any CSS colour typed in. The swatches are one `radiogroup` per group, reached
 * with Tab once (the chosen one, else the first) and the arrow keys after, as radios are. The picker knows no tokens: each swatch is
 * given the CSS colour it is drawn in, so a token set can be shown as it looks.
 */
export function SwatchPicker({ groups, value: valueProp, defaultValue, onValueChange, allowCustom = false, clearable = false, placeholder = "Choose a colour", trigger, className, "aria-label": ariaLabel, ...props }: SwatchPickerProps) {
  const [value, setValue] = useControllableState<string | undefined>({ value: valueProp, defaultValue, onChange: onValueChange, name: "value" });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  const all = useMemo(() => groups.flatMap((group) => group.swatches), [groups]);
  const chosen = all.find((swatch) => swatch.value === value);
  const chosenColor = chosen?.color ?? (value && isCssColor(value) ? value : undefined);

  const typed = query.trim();
  const needle = typed.toLowerCase();
  const shown = useMemo(
    () => groups.map((group) => ({ ...group, swatches: needle ? group.swatches.filter((s) => `${s.label ?? ""} ${s.value}`.toLowerCase().includes(needle)) : group.swatches })).filter((group) => group.swatches.length > 0),
    [groups, needle],
  );
  const custom = allowCustom && typed && isCssColor(typed) && !all.some((swatch) => swatch.value === typed) ? typed : null;
  const visible = shown.flatMap((group) => group.swatches);
  // One stop in the tab order: the chosen swatch if it is shown, else the first.
  const tabbable = (visible.find((swatch) => swatch.value === value) ?? visible[0])?.value;

  const choose = (next: string | undefined) => {
    setValue(next);
    setOpen(false);
    setQuery("");
  };

  /** Arrows move between swatches as they are laid out: left and right along a row, up and down to the nearest swatch in the next row. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const radios = [...(panel.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])];
    const index = radios.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    const go = (to?: HTMLElement) => {
      if (!to) return;
      event.preventDefault();
      to.focus();
    };
    const here = radios[index].getBoundingClientRect();
    const row = (direction: 1 | -1) => {
      const candidates = radios.filter((radio) => (direction === 1 ? radio.getBoundingClientRect().top >= here.bottom - 1 : radio.getBoundingClientRect().bottom <= here.top + 1));
      const nearestRow = candidates.reduce((best, radio) => (best === undefined ? radio.getBoundingClientRect().top : direction === 1 ? Math.min(best, radio.getBoundingClientRect().top) : Math.max(best, radio.getBoundingClientRect().top)), undefined as number | undefined);
      const inRow = candidates.filter((radio) => radio.getBoundingClientRect().top === nearestRow);
      return inRow.sort((a, b) => Math.abs(a.getBoundingClientRect().left - here.left) - Math.abs(b.getBoundingClientRect().left - here.left))[0];
    };
    if (event.key === "ArrowRight") go(radios[index + 1]);
    else if (event.key === "ArrowLeft") go(radios[index - 1]);
    else if (event.key === "ArrowDown") go(row(1));
    else if (event.key === "ArrowUp") go(row(-1));
    else if (event.key === "Home") go(radios[0]);
    else if (event.key === "End") go(radios[radios.length - 1]);
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
    <Popover trigger={button} open={open} onOpenChange={setOpen} role="dialog" aria-label={ariaLabel} placement="bottom-start" maxHeight="24rem">
      <div {...mergeProps({ "data-component": "SwatchPicker", className: clsx(classes.Panel, className) }, {})} ref={panel} onKeyDown={onKeyDown}>
        {all.length > SEARCHABLE || allowCustom ? (
          <InputText size="sm" aria-label={`Search ${ariaLabel}`} placeholder={allowCustom ? "Search or type a colour" : "Search"} value={query} onChange={(event) => setQuery(event.target.value)} leadingVisual={<Icon name="search" />} />
        ) : null}
        {custom ? (
          <button type="button" className={classes.Custom} onClick={() => choose(custom)}>
            <span className={classes.Dot} data-outline={needsOutline(custom) ? "" : undefined} style={{ "--swatch": custom } as React.CSSProperties} />
            <Text as="span" size="md">
              Use {custom}
            </Text>
          </button>
        ) : null}
        {clearable ? (
          <button type="button" className={classes.Custom} onClick={() => choose(undefined)} aria-pressed={value === undefined}>
            <span className={classes.Dot} data-empty="" />
            <Text as="span" size="md">
              None
            </Text>
          </button>
        ) : null}
        {shown.map((group) => (
          <div key={group.label} className={classes.Group}>
            <Text as="span" size="sm" weight="medium" color="neutral.muted">
              {group.label}
            </Text>
            <div role="radiogroup" aria-label={group.label} className={classes.Swatches}>
              {group.swatches.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  role="radio"
                  aria-checked={swatch.value === value}
                  aria-label={swatch.label ?? swatch.value}
                  title={swatch.label ?? swatch.value}
                  tabIndex={swatch.value === tabbable ? 0 : -1}
                  className={classes.Swatch}
                  data-outline={needsOutline(swatch.color) ? "" : undefined}
                  style={{ "--swatch": swatch.color } as React.CSSProperties}
                  onClick={() => choose(swatch.value)}
                />
              ))}
            </div>
          </div>
        ))}
        {shown.length === 0 && !custom ? (
          <Text size="sm" color="neutral.muted" role="status">
            No colours match.
          </Text>
        ) : null}
      </div>
    </Popover>
  );
}
