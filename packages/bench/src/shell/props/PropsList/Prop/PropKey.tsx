import React from "react";
import { VisuallyHidden } from "../../../../ui/index";
import type { PropInfo } from "./types";
import classes from "./Prop.module.css";

/** A prop's name, in the colour of a variable; a function's in the colour of a keyword, since it is called, not read. */
export function PropKey({ prop }: { prop: PropInfo }) {
  const called = prop.kind === "event" || prop.kind === "function";
  return (
    <span className={classes.Key} data-component="Prop.Key" data-function={called ? "" : undefined} title={prop.description}>
      {prop.name}
      {prop.required ? <VisuallyHidden> (required)</VisuallyHidden> : null}
    </span>
  );
}
