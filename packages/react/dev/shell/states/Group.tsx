import React from "react";
import classes from "./Group.module.css";

/** The pill over a card: "Variant : Primary". `as` is the heading level, so the page keeps its outline. */
export function Group({ kind, name, capitalize, as: Heading = "h2", children }: { kind?: string; name?: string; capitalize?: boolean; as?: "h2" | "h3"; children: React.ReactNode }) {
  return (
    <section className={classes.Group} aria-label={name ? `${kind ?? ""} ${name}`.trim() : undefined} data-component="Shell.Group">
      {name ? (
        <Heading className={classes.Label}>
          {kind ? (
            <>
              <span className={classes.Key}>{kind}</span> : <span className={classes.Value} data-capitalize={capitalize ? "" : undefined}>{name}</span>
            </>
          ) : (
            <span className={classes.Value} data-capitalize={capitalize ? "" : undefined}>{name}</span>
          )}
        </Heading>
      ) : null}
      <div className={classes.Card}>{children}</div>
    </section>
  );
}
