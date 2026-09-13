import React from "react";
import type { IconAxes, IconLibrary } from "../IconLibrary";
import type { IconName } from "./iconNames.generated";
import styles from "./materialSymbols.module.css";

const STYLE_CLASS: Record<IconAxes["style"], string> = {
  rounded: styles["Glyph--rounded"],
  outlined: styles["Glyph--outlined"],
  sharp: styles["Glyph--sharp"],
};

/**
 * Default {@link IconLibrary} — Google's variable Material Symbols font,
 * self-hosted (see materialSymbols.module.css for the @font-face rules).
 *
 * Each glyph renders as a `<span>` of the icon's ligature text (Material's
 * ligature text equals its canonical name, e.g. "account_circle" — no glyph
 * lookup table needed) styled with the matching style's font-family and
 * `font-variation-settings` for weight/grade/opticalSize/fill. Sizing is left
 * to the parent — this renders at `font-size: 1em` and `Icon`'s wrapping span
 * sets the actual pixel box via `sizes.icon.*`.
 */
export const materialSymbolsIconLibrary: IconLibrary = {
  resolve(name: IconName, axes: IconAxes): React.ReactElement {
    const variationSettings = [
      `"FILL" ${axes.fill ? 1 : 0}`,
      `"wght" ${axes.weight}`,
      `"GRAD" ${axes.grade}`,
      `"opsz" ${axes.opticalSize}`,
    ].join(", ");

    return (
      <span
        className={[styles.Glyph, STYLE_CLASS[axes.style]].filter(Boolean).join(" ")}
        style={{ fontVariationSettings: variationSettings }}
      >
        {name}
      </span>
    );
  },
};
