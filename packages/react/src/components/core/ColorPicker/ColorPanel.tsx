import React, { useMemo, useState } from "react";
import { clsx } from "clsx";
import { isCssColor } from "../../../utils/colorPaths";
import { normalizeHex } from "../../../utils/color";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import { InputText } from "../InputText";
import { SegmentedControl } from "../SegmentedControl";
import { Switch } from "../Switch";
import { Text } from "../Text";
import { ColorSpectrum } from "./ColorSpectrum";
import { SwatchGrid } from "./SwatchGrid";
import type { SwatchGridAppearance, SwatchGroup } from "./SwatchGrid";
import classes from "./ColorPanel.module.css";

export type ColorPanelProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "defaultValue" | "onChange" | "color"> & {
  /** The colours to choose from, in groups. */
  groups: SwatchGroup[];
  /** The `value` of the swatch chosen, or a hex colour chosen by eye. Pair it with `onValueChange`. */
  value?: string;
  /** Called with the `value` of the swatch chosen, a hex colour (from the Custom side), or `undefined` when it is cleared. */
  onValueChange?: (value: string | undefined) => void;
  /**
   * Add a Custom side to the panel: a gradient of saturation and brightness, a hue slider and a hex field, for a colour no swatch has. A
   * panel of design tokens leaves it off (the tokens are the choice); a tool that takes any colour (a CSS inspector) turns it on. @default false
   */
  custom?: boolean;
  /**
   * Show a Border switch under the colours, for a surface: a border in the same hue as the fill is a part of how that colour is used, not a
   * second colour. Give it with `onBorderedChange`; the panel does not draw the border, it reports the choice.
   */
  bordered?: boolean;
  onBorderedChange?: (bordered: boolean) => void;
  /** Add a "no colour" swatch, first in the grid, to clear the choice. @default false */
  clearable?: boolean;
  /** How each swatch is drawn: a square of the colour, a highlight (the colour with an A on it), or a text colour (an A in the colour). @default "fill" */
  appearance?: SwatchGridAppearance;
  /** Swatches to a row, which sets how wide the panel is: it is as wide as this many swatches, whatever the palette. @default 8 */
  columns?: number;
  /** Draw each group's label above its row. Off, the groups are rows one under another. @default false */
  showLabels?: boolean;
  /** Add a search field above the swatches, for a long palette. @default false */
  searchable?: boolean;
  /** Names the panel. */
  "aria-label": string;
};

/**
 * A panel for choosing a colour, in the page: the swatches of a `SwatchGrid` (with a search field for a long palette), a Custom side with a
 * gradient and a hue slider when any colour may be chosen, and a Border switch for a surface. Colours that go behind text (a surface) come
 * with a border in the same hue, so that is a switch; colours that are text are few, because each must be readable, so they are a small grid.
 * `ColorPicker` is this panel behind a button. The panel knows no tokens: each swatch is given the CSS colour it is drawn in.
 */
export function ColorPanel({
  groups,
  value,
  onValueChange,
  custom = false,
  bordered,
  onBorderedChange,
  clearable = false,
  appearance = "fill",
  columns = 8,
  showLabels = false,
  searchable = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: ColorPanelProps) {
  const all = useMemo(() => groups.flatMap((group) => group.swatches), [groups]);
  const isSwatch = value !== undefined && all.some((swatch) => swatch.value === value);
  // The Custom side opens first when what is chosen is a colour no swatch has.
  const [side, setSide] = useState<"tokens" | "custom">(custom && value !== undefined && !isSwatch && isCssColor(value) ? "custom" : "tokens");
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState<string | undefined>();

  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () => groups.map((group) => ({ ...group, swatches: needle ? group.swatches.filter((s) => `${s.label ?? ""} ${s.value}`.toLowerCase().includes(needle)) : group.swatches })).filter((group) => group.swatches.length > 0),
    [groups, needle],
  );

  const chosenColor = all.find((swatch) => swatch.value === value)?.color ?? value;
  const hex = (chosenColor && normalizeHex(chosenColor)) || "#000000";
  const hexText = typed ?? hex;

  return (
    <div {...mergeProps({ "data-component": "ColorPanel", role: "group", "aria-label": ariaLabel, className: clsx(classes.Panel, className) }, props as object)}>
      {custom ? (
        <SegmentedControl aria-label={`${ariaLabel} source`} value={side} onValueChange={(next) => setSide(next as "tokens" | "custom")} size="sm" block>
          <SegmentedControl.Item value="tokens">Tokens</SegmentedControl.Item>
          <SegmentedControl.Item value="custom">Custom</SegmentedControl.Item>
        </SegmentedControl>
      ) : null}

      {/* Both sides are laid in one cell, the one not chosen hidden and inert, so the panel is as big as the bigger of them and does not
          change size as the switch does. */}
      <div className={classes.Sides}>
        <div className={classes.Side} data-active={side === "tokens" ? "" : undefined} aria-hidden={side !== "tokens"} inert={side !== "tokens"}>
          {searchable ? <InputText size="sm" aria-label={`Search ${ariaLabel}`} placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} leadingVisual="search" /> : null}
          {shown.length > 0 ? (
            <SwatchGrid
              aria-label={ariaLabel}
              groups={shown}
              value={value}
              onValueChange={onValueChange}
              // "No colour" is the first tile of the grid; it is not a match for what is searched for, so it goes while there is a search.
              none={clearable && !needle ? { selected: value === undefined, onSelect: () => onValueChange?.(undefined) } : undefined}
              appearance={appearance}
              columns={columns}
              showLabels={showLabels}
            />
          ) : (
            <Text size="sm" color="neutral.muted" role="status">
              No colours match.
            </Text>
          )}
        </div>
        {custom ? (
          <div className={classes.Side} data-active={side === "custom" ? "" : undefined} aria-hidden={side !== "custom"} inert={side !== "custom"}>
            <ColorSpectrum
              aria-label={`${ariaLabel} spectrum`}
              value={hex}
              onValueChange={(next) => {
                setTyped(undefined);
                onValueChange?.(next);
              }}
            />
            <InputText
              size="sm"
              label="Hex"
              value={hexText}
              onChange={(event) => {
                setTyped(event.target.value);
                const next = normalizeHex(event.target.value);
                if (next) onValueChange?.(next);
              }}
              onBlur={() => setTyped(undefined)}
              error={typed !== undefined && !normalizeHex(typed) ? "Enter a hex colour, like #1c60d4" : undefined}
            />
          </div>
        ) : null}
      </div>

      {onBorderedChange ? <Switch label="Border" checked={Boolean(bordered)} onCheckedChange={onBorderedChange} /> : null}
    </div>
  );
}
