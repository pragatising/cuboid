import React, { useMemo } from "react";
import { clsx } from "clsx";
import { mergeProps } from "../../../utils/mergeProps";
import { needsOutline } from "../../../utils/outline";
import { Text } from "../Text";
import classes from "./SwatchGrid.module.css";

/** One colour to choose: what it is called in code, and the CSS colour it is drawn in. */
export type Swatch = {
  /** What is chosen and reported: a token path (`"neutral.muted"`), a palette name (`"indigo.5"`), a CSS colour. */
  value: string;
  /** How it looks, as CSS (`"#6f6f6d"`): the caller resolves a token to its colour, so the picker knows no tokens. */
  color: string;
  /** What it is called to a person, when `value` is not it. */
  label?: string;
};

/** A row of swatches: a scale, a family, a purpose. Its label names the row to assistive technology, and is drawn only with `showLabels`. */
export type SwatchGroup = { label: string; swatches: Swatch[] };

/**
 * How a swatch is drawn. `fill`: a square of the colour. `highlight`: the colour as a background, with the letter A on it (a highlight).
 * `text`: the letter A drawn in the colour (a text colour).
 */
export type SwatchGridAppearance = "fill" | "highlight" | "text";

export type SwatchGridProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "color" | "onChange"> & {
  /** The colours, one row per group. */
  groups: SwatchGroup[];
  /** The `value` of the swatch chosen. */
  value?: string;
  /** Called with the `value` of the swatch chosen. */
  onValueChange?: (value: string) => void;
  /** @default "fill" */
  appearance?: SwatchGridAppearance;
  /**
   * A swatch for "no colour", first in the grid: a tile with a slash through it, as in a document editor's colour menu. It is chosen like any
   * other (a radio, ringed when it is the one chosen), and says nothing is chosen. Leave it out for a grid that always has a colour.
   */
  none?: { /** What it is called. @default "None" */ label?: string; selected: boolean; onSelect: () => void };
  /**
   * A fixed number of swatches to a row: each group fills rows of this many and then wraps, so the grid is exactly this wide whatever the
   * palette. Left out, each group is one row that wraps only when the container is narrower.
   */
  columns?: number;
  /** Draw each row's label above it. Off, the rows run one under another and the labels only name them. @default false */
  showLabels?: boolean;
  /** Names the grid. */
  "aria-label": string;
};

/**
 * Colours to choose from, laid out in the page: rows of swatches, no popover, no search, no headings unless asked for. It is the part of a
 * colour field that other panels (a pill's editor, a callout's) put inline; `SwatchPicker` is this grid in a popover behind a button.
 * Each row is a `radiogroup`. Tab reaches the grid once (the chosen swatch, else the first) and the arrow keys move as the swatches are
 * laid out, as the radios of one group do. The grid knows no tokens: each swatch is given the CSS colour it is drawn in.
 */
export function SwatchGrid({ groups, value, onValueChange, none, appearance = "fill", columns, showLabels = false, className, ref, onKeyDown, "aria-label": ariaLabel, ...props }: SwatchGridProps) {
  const visible = useMemo(() => groups.flatMap((group) => group.swatches), [groups]);
  // One stop in the tab order: the chosen swatch if it is shown, else the first.
  // When "no colour" is the one chosen, it is the stop; otherwise the chosen swatch, else the first of the grid (the none tile, if there is one).
  const tabbable = none?.selected ? "" : (visible.find((swatch) => swatch.value === value) ?? (none ? undefined : visible[0]))?.value;
  const noneIsStop = Boolean(none) && (none!.selected || !visible.some((swatch) => swatch.value === value));
  const letter = appearance !== "fill";

  /** Arrows move between swatches as they are laid out: left and right along a row, up and down to the nearest swatch in the next row. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const radios = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
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

  return (
    <div {...mergeProps({ "data-component": "SwatchGrid", role: "group", "aria-label": ariaLabel, className: clsx(classes.Grid, className) }, props as object)} ref={ref} onKeyDown={handleKeyDown}>
      {groups.map((group, row) => (
        <div key={group.label} className={classes.Group}>
          {showLabels ? (
            <Text as="span" size="sm" weight="medium" color="neutral.muted">
              {group.label}
            </Text>
          ) : null}
          <div role="radiogroup" aria-label={group.label} className={classes.Row} data-columns={columns ? "" : undefined} style={columns ? ({ "--columns": columns } as React.CSSProperties) : undefined}>
            {row === 0 && none ? (
              <button
                type="button"
                role="radio"
                aria-checked={none.selected}
                aria-label={none.label ?? "None"}
                title={none.label ?? "None"}
                tabIndex={noneIsStop ? 0 : -1}
                className={classes.Swatch}
                data-none=""
                onClick={none.onSelect}
              />
            ) : null}
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
                data-appearance={appearance}
                data-outline={appearance !== "text" && needsOutline(swatch.color) ? "" : undefined}
                style={{ "--swatch": swatch.color } as React.CSSProperties}
                onClick={() => onValueChange?.(swatch.value)}
              >
                {letter ? <span aria-hidden="true">A</span> : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
