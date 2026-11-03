import React from "react";
import { ColorPicker, needsOutline, type Tokens } from "../../../../../../ui/index";
import { SelectChip } from "../../../../SelectChip";
import { TypeSignature } from "../TypeSignature";
import { swatchColor, swatchGroups } from "./colors";
import type { Scale } from "./colors";
import classes from "../PropSelectors.module.css";

/** A colour chip: the colour as a dot, its name, and a chevron, opening the kit's own swatches to choose from (and, where it is allowed, any CSS colour). */
export function PropSelectorsTokenColor({
  label,
  text,
  tokens,
  scale,
  family,
  groups,
  value,
  clearable,
  custom,
  tone,
  onChoose,
}: {
  label: string;
  text: string;
  tokens: Tokens;
  scale: Scale;
  family?: boolean;
  groups: ReturnType<typeof swatchGroups>;
  value: string | undefined;
  clearable?: boolean;
  custom?: boolean;
  tone?: "type" | "string" | "number";
  onChoose: (value: string | undefined) => void;
}) {
  const color = text ? swatchColor(tokens, text, scale, family) : null;
  // One grid of every colour, in the order the tokens come, with no heading per family: each swatch is named by its token path and can be searched for.
  const flat = [{ label, swatches: groups.flatMap((group) => group.swatches) }];
  return (
    <ColorPicker
      aria-label={label}
      groups={flat}
      value={value}
      clearable={clearable}
      custom={custom}
      // The token sets are long, so the picker can be searched.
      searchable
      onValueChange={onChoose}
      trigger={
        <SelectChip tone={tone} aria-label={`${label}: ${text || "none"}`}>
          {/* The swatch is of what is chosen: with nothing chosen the chip is only the set's name. */}
          {tone === "type" ? null : (
            <span
              className={classes.Dot}
              data-empty={color ? undefined : ""}
              data-outline={color && needsOutline(color) ? "" : undefined}
              style={color ? ({ "--swatch": color } as React.CSSProperties) : undefined}
            />
          )}
          {tone === "type" ? <TypeSignature type={text} /> : text}
        </SelectChip>
      }
    />
  );
}
