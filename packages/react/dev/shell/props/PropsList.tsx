import React from "react";
import { Switch, Text, VisuallyHidden, useTokens } from "../../../src";
import { resolveSyntaxColors } from "../../../src/components/CodeBlock/syntaxColors";
import components from "../../generated/components.json";
import classes from "./PropsList.module.css";

/** A prop as `components.json` has it, from the component's own types. */
type Prop = { name: string; required?: boolean; type: string; kind: string; values?: (string | number)[]; default?: string; description?: string };

const PROPS = (components as unknown as Record<string, { props: Prop[] }>);

/** `"md"` as written in the source is `md`: what the chips and the default are compared in. */
/** `((value: string) => void)` is written `(value: string) => void`: the outer pair is the type's own wrapping. */
const unwrap = (type: string) => (/^\((.*)\)$/.test(type) && !/^\([^()]*\)$/.test(type) && /=>/.test(type) ? type.slice(1, -1) : type);

const unquote = (source: string | undefined) => source?.replace(/^["'](.*)["']$/, "$1");

/**
 * The component's properties (Figma 3346:108517), one row each, from its types: a choice is its values as chips, an on/off prop a
 * switch, and anything else the type it takes in braces. The default is marked, a required prop has a star, and the prop's own
 * comment is its tooltip.
 */
export function PropsList({ component }: { component: string }) {
  const tokens = useTokens();
  const syntax = resolveSyntaxColors(tokens);
  const props = PROPS[component]?.props ?? [];

  if (props.length === 0) {
    return (
      <Text size="sm" color="neutral.muted">
        {component} has no props of its own.
      </Text>
    );
  }

  return (
    <ul className={classes.List} style={{ ["--name" as string]: syntax.componentTag, ["--brace" as string]: syntax.numberLiteral, ["--type" as string]: syntax.componentTag }} aria-label={`${component} properties`}>
      {props.map((prop) => (
        <li key={prop.name} className={classes.Row}>
          <span className={classes.Name} title={prop.description}>
            {prop.name}
            {prop.required ? (
              <>
                <span aria-hidden="true">*</span>
                <VisuallyHidden> (required)</VisuallyHidden>
              </>
            ) : null}
          </span>
          <span className={classes.Colon} aria-hidden="true">
            :
          </span>
          <Value prop={prop} />
        </li>
      ))}
    </ul>
  );
}

function Value({ prop }: { prop: Prop }) {
  if (prop.kind === "enum" && prop.values?.length) {
    const fallback = unquote(prop.default);
    return (
      <span className={classes.Values}>
        {prop.values.map((value) => (
          <span key={value} className={classes.Chip} data-default={String(value) === fallback ? "" : undefined}>
            {String(value)}
            {String(value) === fallback ? <VisuallyHidden> (default)</VisuallyHidden> : null}
          </span>
        ))}
      </span>
    );
  }
  if (prop.kind === "flag") {
    const on = prop.default === "true";
    // A display of the prop, not a control for it: the switch says which way it is by default and does nothing when pressed.
    return <Switch readOnly checked={on} aria-label={`${prop.name}, ${on ? "on" : "off"} by default`} />;
  }
  if (prop.kind === "value") {
    return (
      <span className={classes.Values}>
        <span className={classes.Chip} data-type="">
          {prop.type}
        </span>
      </span>
    );
  }
  // A slot, a handler, a function, a ref, anything the types say more about than a word: the type, as it is written in JSX.
  return (
    <span className={classes.Values}>
      <span className={classes.Brace} aria-hidden="true">
        {"{"}
      </span>
      <span className={classes.Chip} data-type="" title={prop.type}>
        {prop.kind === "slot" ? "React.Node" : unwrap(prop.type)}
      </span>
      <span className={classes.Brace} aria-hidden="true">
        {"}"}
      </span>
    </span>
  );
}
