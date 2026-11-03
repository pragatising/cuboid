import React from "react";
import type { PropState } from "../useProp";
import type { Member, PropInfo } from "../types";
import { PropSelectorsToken, valuesOf } from "./PropSelectorsToken";
import classes from "./PropSelectors.module.css";

/**
 * A type made of sets of values and shapes (Figma 3392:52737): a token for each (`FgColor ⌄ | #hex`), a thin rule between, and the one that
 * holds the value shows it. A prop that is one named set, or only a long choice of its own values, is the same with the one token.
 */
export function PropSelectorsTokenSets({ prop, state }: { prop: PropInfo; state: PropState }) {
  // A prop with no parts is a choice of its own values, chosen as an enum is.
  const enumMode = !prop.members?.length;
  const members: Member[] = prop.members?.length ? prop.members : [{ name: prop.type, values: prop.values }];
  // What is applied: what the example sets, or else the default.
  const applied = state.shown;
  const shown = typeof applied === "string" || typeof applied === "number" ? String(applied) : undefined;
  // The set the value is in holds it; a value in none of them (typed) is the first part that takes a typed value.
  const inSet = shown === undefined ? -1 : members.findIndex((member) => valuesOf(member).some((value) => String(value) === shown));
  const owner = shown === undefined ? -1 : inSet !== -1 ? inSet : members.findIndex((member) => member.free);
  return (
    <span className={classes.TokenSets} data-component="Prop.Selectors.TokenSets">
      {members.map((member, index) => (
        <React.Fragment key={`${member.name}-${index}`}>
          {index > 0 ? <span className={classes.Rule} aria-hidden="true" /> : null}
          <PropSelectorsToken prop={prop} state={state} member={member} held={index === owner ? shown : undefined} enumMode={enumMode} />
        </React.Fragment>
      ))}
    </span>
  );
}
