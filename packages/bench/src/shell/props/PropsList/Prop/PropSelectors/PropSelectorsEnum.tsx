import React from "react";
import { VisuallyHidden } from "../../../../../ui/index";
import { chosen } from "../../../overrides";
import type { PropState } from "../useProp";
import type { PropInfo } from "../types";
import classes from "./PropSelectors.module.css";

/** `"md"` as written in the source is `md`: what the chips and the default are compared in. */
export const unquote = (source: string | undefined) => source?.replace(/^["'](.*)["']$/, "$1");

/** A few values side by side in a tray, the one in use lifted out of it (Figma 3374:33206). */
export function PropSelectorsEnum({ prop, state }: { prop: PropInfo; state: PropState }) {
  const shown = state.shown;
  return (
    <span className={classes.Tray} role="radiogroup" aria-label={prop.name} data-component="Prop.Selectors.Enum">
      {(prop.values ?? []).map((value) => {
        const on = String(shown) === String(value);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            className={classes.Choice}
            data-on={on ? "" : undefined}
            onClick={() => state.set(chosen(value, prop.default, state.node, prop.name))}
          >
            {String(value)}
            {String(value) === unquote(prop.default) ? <VisuallyHidden> (default)</VisuallyHidden> : null}
          </button>
        );
      })}
    </span>
  );
}
