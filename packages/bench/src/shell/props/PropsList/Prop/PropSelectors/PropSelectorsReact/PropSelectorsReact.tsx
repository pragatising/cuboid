import React, { useMemo, useState } from "react";
import { Autocomplete, Button, Icon } from "../../../../../../ui/index";
import { CodeEditor } from "../../../../../code/CodeEditor";
import type { PropState } from "../../useProp";
import type { PropInfo } from "../../types";
import { fieldProps } from "../PropField";
import classes from "../PropSelectors.module.css";
import { nameOf, slotCandidates } from "./candidates";

/**
 * What goes in a slot (`React.ReactNode`, Figma 3392:49459): an autocomplete. Typing narrows the components that fit in it (every one the
 * library exports that can be drawn alone and breaks no rule of the HTML content model), choosing one puts it in the example, and where
 * text fits (`children`) what is typed is the content: it is used when the field is left. A slot that is not required can be emptied.
 */
export function PropSelectorsReact({ prop, state }: { prop: PropInfo; state: PropState }) {
  const { current, node, doc } = state;
  const name = nameOf(current);
  // What the example holds, as the field shows it: the component's name, or the text.
  // Content written as elements is the value as the code has it: the field shows it on one line, and the list's first choice, `Custom`, is that code, selected.
  const code = state.written && /[<{]/.test(state.written) ? state.written : undefined;
  const held = code ? code.replace(/\s*\n\s*/g, " ") : typeof current === "string" ? current : Array.isArray(current) && current.every((c) => typeof c === "string") && current.length ? current.join("") : name && name !== "Text" ? name : "";
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  // Clicking the field opens the list even when it already has focus (it was chosen from a moment ago).
  const [open, setOpen] = useState(false);
  const control = !!doc?.element;
  const textFits = !control;
  // Worked out when the field is first used (it tries every component), and kept.
  const candidates = useMemo(() => (focused && node ? slotCandidates(state.component, node, prop.name, control) : []), [focused, node, state.component, prop.name, control]);
  const value = draft ?? held;
  const needle = draft === null || draft === held ? "" : draft.trim().toLowerCase();
  const matching = needle ? candidates.filter((candidate) => candidate.label.toLowerCase().includes(needle)) : candidates;
  const literal = draft?.trim() ?? "";
  const offerText = textFits && !code && literal !== "" && literal !== held && !candidates.some((candidate) => candidate.label === literal);

  const settle = () => {
    if (draft === null) return;
    // Leaving the field with text in it makes the text the content, where text fits; leaving it empty takes the content away.
    if (offerText) state.set(literal);
    else if (literal === "" && held !== "" && !code && !prop.required) state.set(undefined);
    setDraft(null);
  };

  return (
    <Autocomplete
      // Code is long: the field takes the rest of the line after the key, and cuts the text short inside itself.
      wrapperProps={code ? ({ "data-fill": "" } as object) : undefined}
      {...fieldProps({ kind: "type", label: prop.name, placeholder: "React.ReactNode", value, width: 15, trailingVisual: <Icon name="keyboard_arrow_down" size="sm" aria-hidden="true" /> })}
      open={open}
      header={
        code ? (
          // What is chosen already: the code as the example has it, above the other choices. It is not one of them (it is not a row of the list).
          <div className={classes.Custom} data-component="Prop.Selectors.Custom">
            <div className={classes.CustomHead}>
              <span>Custom</span>
              <Icon name="check" size="sm" aria-hidden="true" />
            </div>
            <CodeEditor readOnly fragment value={code} aria-label={`${prop.name} as written`} />
          </div>
        ) : null
      }
      footer={
        // Writing a node of your own and seeing what it draws: to be wired up.
        <Button variant="secondary" size="sm" disabled>
          Add custom node
        </Button>
      }
      onOpenChange={(next) => {
        setOpen(next);
        // The list closing (Tab, Escape, a click outside) is the field being left.
        if (!next) settle();
      }}
      onKeyDown={(event) => event.key === "Enter" && settle()}
      onClick={() => setOpen(true)}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={settle}
      onSelect={(item) => {
        const id = item.dataset.id;
        if (id === "none") state.set(undefined);
        else if (id === "text") state.set(literal);
        else {
          const candidate = candidates.find((c) => c.id === id);
          if (candidate) state.set(candidate.value);
        }
        setDraft(null);
      }}
    >
      {!prop.required && held !== "" && draft === null ? (
        <Autocomplete.Item key="none" data-id="none">
          None
        </Autocomplete.Item>
      ) : null}
      {offerText ? (
        <Autocomplete.Item key="text" data-id="text">
          Use “{literal}”
        </Autocomplete.Item>
      ) : null}
      {matching.map((candidate) => (
        <Autocomplete.Item key={candidate.id} data-id={candidate.id} selected={!code && candidate.id === name}>
          {candidate.label}
        </Autocomplete.Item>
      ))}
    </Autocomplete>
  );
}
