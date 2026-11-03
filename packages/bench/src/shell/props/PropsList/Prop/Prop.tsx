import React from "react";
import { PropKey } from "./PropKey";
import { PropOperator } from "./PropOperator";
import { PropSelectors } from "./PropSelectors";
import type { Live, PropInfo } from "./types";
import classes from "./Prop.module.css";

/**
 * One prop, as the Figma draws it (Prop, 3374:33315): its key, the operator that says whether it is optional, and the selectors that
 * choose or type its value. Where an example is being played with (`live`) the selectors change it; otherwise they say what the type is.
 */
function PropRoot({ prop, live, note }: { prop: PropInfo; live: Live | null; /** What is said after the selectors: what a component does with the prop (see `PropsList`). */ note?: React.ReactNode }) {
  return (
    <li className={classes.Prop} data-component="Prop">
      <Prop.Key prop={prop} />
      <Prop.Operator required={!!prop.required} />
      <Prop.Selectors prop={prop} live={live} />
      {note}
    </li>
  );
}

export const Prop = Object.assign(PropRoot, { Key: PropKey, Operator: PropOperator, Selectors: PropSelectors });
