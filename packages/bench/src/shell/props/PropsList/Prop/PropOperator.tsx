import React from "react";
import classes from "./Prop.module.css";

/** `:` after a required prop's name, `?:` after an optional one's, `=` after one the component sets. */
export function PropOperator({ required, assign }: { required?: boolean; /** `=`: a value the component sets itself, not a prop it takes. */ assign?: boolean }) {
  return (
    <span className={classes.Operator} data-component="Prop.Operator" aria-hidden="true">
      {assign ? "=" : required ? ":" : "?:"}
    </span>
  );
}
