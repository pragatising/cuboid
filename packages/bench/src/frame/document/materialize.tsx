import React from "react";
import { toElement } from "../../engine/render";
import type { Node, Value } from "../../engine/types";
import { resolve } from "./resolve";

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null && !Array.isArray(value) && "tag" in value;

/** What the pane holds for content (a node, or a list of them and text) as what the component takes. */
export function materialize(value: Value | undefined): unknown {
  if (isNode(value)) return toElement(value, resolve, new Map());
  if (Array.isArray(value)) return value.map((item, index) => (typeof item === "string" ? item : <React.Fragment key={index}>{toElement(item, resolve, new Map())}</React.Fragment>));
  return value;
}
