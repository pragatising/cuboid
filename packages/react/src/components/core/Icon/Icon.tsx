import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
import type { IconAxes } from "../../../icons/IconLibrary";
import { materialSymbolsIconLibrary } from "../../../icons/material/materialSymbolsIconLibrary";
import type { IconName } from "@sragatiping/cuboid-primitives/icons/names";
import classes from "./Icon.module.css";

export type { IconName };

/** A key of `tokens.icon`. */
export type IconSize = keyof Tokens["icon"];

/** Material Symbols Rounded, weight 400: the default look for every icon. */
const DEFAULT_AXES: IconAxes = { weight: 400, grade: 0, opticalSize: 24, fill: false, style: "rounded" };

export type IconProps = Omit<React.ComponentPropsWithRef<"span">, "color" | "children"> & {
  /** Canonical Material Symbols name, e.g. `"account_circle"`. */
  name: IconName;
  /** Which `icon` size token sets the width, height and font size. @default "sm" */
  size?: IconSize;
  /** Which `fgColor` token to colour the glyph with, or any CSS colour. @default inherits the ambient text colour */
  color?: FgColor | CssColor;
  /** When set, the icon is exposed as `role="img"` with this accessible name; otherwise it is decorative. */
  label?: string;
  /** Stroke weight, 100 to 700. @default 400 */
  weight?: number;
  /** Grade, -25 to 200: contrast adjustment independent of weight. @default 0 */
  grade?: number;
  /** Optical size, 20 to 48. @default 24 */
  opticalSize?: number;
  /** Filled rather than outlined glyph. @default false */
  fill?: boolean;
};

/** A glyph from the Material Symbols font, sized by the `icon` tokens. Decorative unless given a `label`. */
export function Icon({
  name,
  size = "sm",
  color,
  label,
  weight = DEFAULT_AXES.weight,
  grade = DEFAULT_AXES.grade,
  opticalSize = DEFAULT_AXES.opticalSize,
  fill = DEFAULT_AXES.fill,
  className,
  ...props
}: IconProps) {
  const tokens = useTokens();
  const { icon } = tokens;
  const { fgColor } = colorGroups(tokens);
  const glyph = materialSymbolsIconLibrary.resolve(name, { weight, grade, opticalSize, fill, style: DEFAULT_AXES.style });

  return (
    <span
      {...mergeProps(
        {
          "data-component": "Icon",
          className: clsx(classes.Icon, className),
          role: label ? "img" : undefined,
          "aria-label": label,
          "aria-hidden": label ? undefined : true,
          style: {
            width: icon[size],
            height: icon[size],
            fontSize: icon[size],
            color: color ? resolveColorValue(fgColor, color) : undefined,
          },
        },
        props,
      )}
    >
      {glyph}
    </span>
  );
}
