import React from "react";
import { Switch } from "../../../../../ui/index";
import { parseDefault } from "../../../../../engine/domains";
import { TypeSignature } from "./TypeSignature";
import type { PropState } from "../useProp";
import type { PropInfo } from "../types";

/** On or off (Figma 3374:33205). Where nothing is played with it is its type, `boolean`, as the code writes it: a switch that cannot be turned is not shown. */
export function PropSelectorsBoolean({ prop, state }: { prop: PropInfo; state: PropState }) {
  const on = state.shown === true;
  if (!state.editable) return <TypeSignature type="boolean" />;
  const standard = parseDefault(prop.default) === true;
  return (
    <Switch
      checked={on}
      aria-label={prop.name}
      // Back to what the types say it is, with no change to write down.
      onCheckedChange={(next) => state.set(next === standard && state.node?.props?.[prop.name] === undefined ? undefined : next)}
    />
  );
}
