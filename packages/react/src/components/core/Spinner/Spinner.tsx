import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import type { CssColor, FgColor } from "../../../utils/colorPaths";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./Spinner.module.css";

/** A key of `tokens.spinner.size`: `xs` 16px, `sm` 20px, `md` 24px, `lg` 80px. */
export type SpinnerSize = keyof Tokens["spinner"]["size"];

export type SpinnerProps = Omit<React.ComponentPropsWithRef<"svg">, "color" | "children"> & {
  /**
   * Which `spinner.size` token sets the width and height. Left out, it is as large as the slot it is in (a button's icon, a list row's
   * icon): a component that holds one sizes it, and on its own it is 1em.
   */
  size?: SpinnerSize;
  /** Which `fgColor` token to draw it in, or any CSS colour. @default inherits the ambient text colour */
  color?: FgColor | CssColor;
  /**
   * When set, the spinner is exposed as `role="img"` with this accessible name; otherwise it is decorative. A spinner shows that
   * something is busy, it does not say so: announce it (a live region) where the page needs to.
   */
  label?: string;
};

/** A busy indicator: a ring with a turning arc, the same 2px thick at every size. It turns slowly under `prefers-reduced-motion`. */
export function Spinner({ size, color, label, className, ...props }: SpinnerProps) {
  const tokens = useTokens();
  const { spinner } = tokens;
  const { fgColor } = colorGroups(tokens);
  const ring = { strokeWidth: spinner.thickness };

  return (
    <svg
      {...mergeProps(
        {
          "data-component": "Spinner",
          className: clsx(classes.Spinner, className),
          // Presentation attributes, so that any rule of a slot that sizes its content wins over them.
          width: "1em",
          height: "1em",
          viewBox: "0 0 16 16",
          fill: "none",
          role: label ? "img" : undefined,
          "aria-label": label,
          "aria-hidden": label ? undefined : true,
          focusable: false,
          style: {
            ...(size ? { width: spinner.size[size], height: spinner.size[size] } : {}),
            color: color ? resolveColorValue(fgColor, color) : undefined,
          },
        },
        props,
      )}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" style={ring} />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={ring} />
    </svg>
  );
}
