import type React from "react";
import type { IconName } from "./material/iconNames.generated";

export type { IconName };

/**
 * Variable-font axes for a single glyph render. Values come from
 * `theme.icon.*` unless overridden per-call on `<Icon>`.
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
 * Pluggable glyph source for {@link Icon}. Configure once via
 * `ThemeProvider`'s `theme.icon.library` — call sites only ever pass a
 * canonical {@link IconName}, never a library-specific import.
 */
export interface IconLibrary {
  resolve(name: IconName, axes: IconAxes): React.ReactElement;
}
