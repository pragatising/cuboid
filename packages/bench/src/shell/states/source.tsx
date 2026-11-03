import React from "react";
import { library } from "virtual:bench";
import components from "~bench/generated/components.json";
import type { ExampleCode } from "../anatomy/exampleSource";
import { printExample } from "../../engine/print";
import { toElement } from "../../engine/render";
import type { Shown } from "../../frame";
import type { ComponentDoc, Node } from "../../engine/types";
import { anatomyExample, composeExamples } from "../playground/compose";
import { ExampleBoundary } from "../playground/ExampleBoundary";
import { importFrom, resolve } from "../playground/host";
import { withProps } from "../props/overrides";
import type { Overrides } from "../props/overrides";

/**
 * What the States and Anatomy views need to draw a component. The variants are the values of its `variant` prop, read from its
 * types (generated/components.json, from `npm run build:components-json`).
 *
 * The example to draw is composed by the engine from the component's props and parts (shell/playground/compose.ts): the richest example
 * that is not in a state of its own. Nothing is read from a story or an example file; to change what is drawn, change the fixtures.
 */

type Args = Record<string, unknown>;
type Documented = Record<
  string,
  { props: { name: string; kind: string; values?: string[] }[] }
>;

export type PreviewSource = {
  /** An element to draw: the example, with `variant` applied when there is one, and what has been changed in the pane written into it. */
  Example: React.ComponentType<{ variant?: string; overrides?: Overrides }>;
  variants: string[];
  /** The example as code, so Anatomy can show it. */
  example: ExampleCode | null;
  /** The example as a frame is shown it (the node and where each element is written), with what has been changed in the pane. */
  shown: (overrides: Overrides) => Extract<Shown, { node: Node }>;
  /** The example's code with the changes made in the pane written in. */
  codeWith: (overrides: Overrides) => ExampleCode | null;
  /** What the pane plays with: the engine's reading of the component and the example's node. Null when no example can be composed. */
  play: { doc: ComponentDoc; node: Node } | null;
};

const NONE: Overrides = {};

/** Draws `render()` (which may use hooks, since this is a component), giving the root the variant when it is the component itself. */
function exampleOf(
  render: (args: Args, overrides: Overrides) => React.ReactNode,
  component: unknown,
  args: Args = {},
) {
  return function Example({ variant, overrides = NONE }: { variant?: string; overrides?: Overrides }) {
    const node = render({ ...args, ...(variant ? { variant } : {}) }, overrides);
    // An example that renders the component itself takes the variant too; one that composes several things cannot, and is drawn as it is.
    return (
      <ExampleBoundary>
        {variant && React.isValidElement(node) && node.type === component
          ? React.cloneElement(node as React.ReactElement<Args>, { variant })
          : node}
      </ExampleBoundary>
    );
  };
}

export async function loadPreviewSource(
  name: string,
): Promise<PreviewSource | null> {
  const variants =
    (components as Documented)[name]?.props.find(
      (prop) => prop.name === "variant" && prop.kind === "enum",
    )?.values ?? [];
  const component = (library as Record<string, unknown>)[name];

  const tour = composeExamples(name);
  const composed = anatomyExample(tour);
  if (!tour || !composed) return null;
  // The example with the pane's changes made in it, and its code printed again, so the lines the pointer marks are the ones of the new code.
  const drawn = (overrides: Overrides) => {
    if (Object.keys(overrides).length === 0) return { node: composed.node, printed: composed.printed };
    const node = withProps(composed.node, name, overrides);
    return { node, printed: printExample(node, { importFrom }) };
  };
  const codeOf = (overrides: Overrides) => {
    const { printed } = drawn(overrides);
    return { name: composed.row.title, code: printed.code, lineMap: printed.lineMap };
  };
  return {
    Example: exampleOf((_, overrides) => {
      const { node, printed } = drawn(overrides);
      return toElement(node, resolve, printed.sources);
    }, component),
    variants,
    example: codeOf(NONE),
    shown: (overrides) => {
      const { node, printed } = drawn(overrides);
      return { node, sources: printed.sources };
    },
    codeWith: codeOf,
    play: { doc: tour.doc, node: composed.node },
  };
}
