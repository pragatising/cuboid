import React from "react";
import type { Live, PropInfo } from "../types";
import { useProp } from "../useProp";
import { unwrap } from "./functionType";
import { PropSelectorsBoolean } from "./PropSelectorsBoolean";
import { PropSelectorsEnum } from "./PropSelectorsEnum";
import { PropSelectorsFunction } from "./PropSelectorsFunction";
import { PropSelectorsReact } from "./PropSelectorsReact";
import { PropSelectorsString } from "./PropSelectorsString";
import { PropSelectorsTokenSets } from "./PropSelectorsTokenSets";
import { selectorOf } from "./selectorOf";
import { TypeSignature } from "./TypeSignature";

/** A long union is its first values and an ellipsis, so a row stays a row. */
const LONG = 48;

/** What a prop is when nothing can be changed (Figma's read-only selectors): its type, written in the colours of code. */
function readOnlyType(prop: PropInfo, type: ReturnType<typeof selectorOf>): string {
  if (type === "tokenSets" || type === "token") {
    // The sets it is made of, and what else it takes: `FgColor | CssColor`, `Length | string`.
    const names = (prop.members ?? []).map((member) => member.name);
    const shapes = (prop.members ?? []).flatMap((member) => member.free ?? []).map((shape) => (shape === "text" ? "string" : shape));
    const parts = [...new Set([...names, ...shapes])];
    if (parts.length) return parts.join(" | ");
  }
  if (type === "react") return "React.ReactNode";
  // As the code writes it, when it can be read: `FlexDirection`, not the ten values the checker lists.
  const written = unwrap(prop.written ?? prop.type);
  if (written.length <= LONG || !prop.values?.length) return written;
  return `${prop.values.slice(0, 3).map((value) => JSON.stringify(value)).join(" | ")} | …`;
}

/**
 * What a prop's value is chosen or typed with (Figma Prop.Selectors, 3392:49459): one selector for each kind of type, chosen by `selectorOf`.
 * Where an example is being played with the selector changes it; where it is not, every prop is its type, written out.
 */
export function PropSelectors({ prop, live }: { prop: PropInfo; live: Live | null }) {
  const state = useProp(prop, live);
  const type = selectorOf(prop);
  if (type === "boolean") return <PropSelectorsBoolean prop={prop} state={state} />;
  if (type === "function") return <PropSelectorsFunction prop={prop} />;
  // Text and numbers are typed, so they are always the pane's to set; a choice from state the app holds (`value`) is not.
  const typed = type === "string" || type === "number";
  if (!(typed ? state.settable : state.editable) || type === "type") return <TypeSignature type={readOnlyType(prop, type)} />;
  switch (type) {
    case "string":
    case "number":
      return <PropSelectorsString prop={prop} state={state} numeric={type === "number"} />;
    case "enum":
      return <PropSelectorsEnum prop={prop} state={state} />;
    case "token":
    case "tokenSets":
      return <PropSelectorsTokenSets prop={prop} state={state} />;
    case "react":
      return <PropSelectorsReact prop={prop} state={state} />;
  }
}
