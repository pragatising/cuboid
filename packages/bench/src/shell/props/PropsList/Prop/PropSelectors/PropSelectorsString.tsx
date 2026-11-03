import React from "react";
import { PropField } from "./PropField";
import type { PropState } from "../useProp";
import type { PropInfo } from "../types";

/** Text or a number, typed (Figma 5038:92224). Empty takes the prop off the example; a number is a number. */
export function PropSelectorsString({ prop, state, numeric }: { prop: PropInfo; state: PropState; numeric: boolean }) {
  const current = state.current;
  const value = typeof current === "string" || typeof current === "number" ? String(current) : "";
  return (
    <PropField
      kind={numeric ? "number" : "string"}
      label={prop.name}
      placeholder={prop.type}
      value={value}
      inputMode={numeric ? "numeric" : undefined}
      onChange={(event) => state.set(typed(event.target.value, numeric))}
    />
  );
}

/** What was typed as the value it stands for: nothing when empty, a number where the prop is one. */
export const typed = (text: string, numeric: boolean) => (text === "" ? undefined : numeric && Number.isFinite(Number(text)) ? Number(text) : text);
