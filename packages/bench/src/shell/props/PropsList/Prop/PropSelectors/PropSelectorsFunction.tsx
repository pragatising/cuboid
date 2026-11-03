import React from "react";
import { functionOf } from "./functionType";
import type { PropInfo } from "../types";
import classes from "./PropSelectors.module.css";

/** A function written out as the Figma has it (3392:49178): `(item: HTMLElement) => void`. It is called, not set, so it is never a control. */
export function PropSelectorsFunction({ prop }: { prop: PropInfo }) {
  const fn = functionOf(prop.type);
  if (!fn) return null;
  return (
    <span className={classes.Function} data-component="Prop.Selectors.Function">
      <span className={classes.Paren}>(</span>
      {fn.params.map((param, index) => (
        <React.Fragment key={index}>
          {param.name ? <span className={classes.ParamName}>{param.name}: </span> : null}
          <span className={classes.ParamType}>{param.type}</span>
          {index < fn.params.length - 1 ? <span className={classes.Arrow}>, </span> : null}
        </React.Fragment>
      ))}
      <span className={classes.Paren}>)</span>
      <span className={classes.Arrow}> =&gt; </span>
      <span className={classes.Returns}>{fn.returns}</span>
    </span>
  );
}
