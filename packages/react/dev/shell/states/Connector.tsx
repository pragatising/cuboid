import React from "react";
import { Popover } from "../../../src";
import classes from "./Connector.module.css";

type LabelProps = React.ComponentPropsWithRef<"button">;

/** The badge. A Popover clones its trigger, so this takes the `ref`, `onClick` and `aria-*` it hands over. */
function Badge({ children, ...props }: LabelProps) {
  return (
    <button type="button" className={classes.Label} {...props}>
      {children}
    </button>
  );
}

/**
 * An interaction: the arrow between two states, with the badge that names what a person does. The badge is a door: clicking it
 * floats a popover over the canvas (the canvas stays whole), where `children` explains it.
 */
export function Connector({ label, quiet, children }: { label: string; /** The two states look the same. */ quiet?: boolean; children?: React.ReactNode }) {
  return (
    <div className={classes.Connector} data-component="Shell.Connector" data-quiet={quiet ? "" : undefined}>
      <span className={classes.Dot} aria-hidden="true" />
      <span className={classes.Line} aria-hidden="true" />
      <Popover trigger={<Badge aria-label={`${label}: what is this?`}>{label}</Badge>} role="dialog" aria-label={label} placement="bottom">
        <Popover.Body>{children}</Popover.Body>
      </Popover>
      <span className={classes.Line} aria-hidden="true" />
      <svg className={classes.Arrow} viewBox="0 0 4 8" fill="none" aria-hidden="true">
        <path d="M.5.5 3.5 4 .5 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
