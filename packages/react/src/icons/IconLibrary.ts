import type React from "react";
import type { IconName } from "@sragatiping/cuboid-primitives/icons/names";

export type { IconName };

/**
 * Variable-font axes for a single glyph render. `<Icon>` supplies the defaults
 * (weight 400, grade 0, optical size 24, outline, rounded) and per-call props override them.
 */
export interface IconAxes {
  /** Stroke weight — 100 to 700. */
  weight: number;
  /** Grade — -25 to 200 (fine contrast/emphasis adjustment independent of weight). */
  grade: number;
  /** Optical size — 20 to 48. */
  opticalSize: number;
  /** Filled vs outlined glyph. */
  fill: boolean;
  /** Glyph family. Material ships Outlined / Rounded / Sharp; other libraries may ignore this. */
  style: "outlined" | "rounded" | "sharp";
}

/**
 * Glyph source for {@link Icon} (Material Symbols today). Call sites only ever
 * pass a canonical {@link IconName}, never a library-specific import.
 */
export interface IconLibrary {
  resolve(name: IconName, axes: IconAxes): React.ReactElement;
}
