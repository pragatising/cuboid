import React from "react";
import * as library from "../../../src";
import components from "../../generated/components.json";
import { exampleCode, exampleNames } from "../anatomy/exampleSource";
import type { ExampleCode } from "../anatomy/exampleSource";
import { toElement } from "../../engine/render";
import { anatomyExample, composeExamples } from "../playground/compose";
import { ExampleBoundary } from "../playground/ExampleBoundary";
import { resolve } from "../playground/host";

/**
 * What the States and Anatomy views need to draw a component. The variants are the values of its `variant` prop, read from its
 * types (generated/components.json, from `npm run build:components-json`).
 *
 * The example to draw is real usage. Where `Component.examples.tsx` sits next to the component it is that: an ordinary function
 * component written as an app would write it (real imports, real hooks), its first export the default, run as it is so a
 * composition (a Header with its parts, a menu with its items) is drawn as that composition. Where there is none the engine composes
 * one from the component's props (dev/engine): the richest example that is not in a state of its own. A story is never read.
 */
const examples = import.meta.glob("../../../src/components/**/*.examples.tsx");
/** The same files as text, for showing the code (the page imports them as modules, so this is a second, raw import). */
const texts = import.meta.glob("../../../src/components/**/*.examples.tsx", { query: "?raw", import: "default" });

type Args = Record<string, unknown>;
type Documented = Record<
  string,
  { props: { name: string; kind: string; values?: string[] }[] }
>;

export type PreviewSource = {
  /** An element to draw: the example, with `variant` applied when there is one. */
  Example: React.ComponentType<{ variant?: string }>;
  variants: string[];
  /** The example as code, so Anatomy can show it. */
  example: ExampleCode | null;
};

const find = (files: Record<string, unknown>, name: string) => Object.keys(files).find((key) => key.endsWith(`/${name}/${name}.examples.tsx`));

/** Draws `render()` (which may use hooks, since this is a component), giving the root the variant when it is the component itself. */
function exampleOf(
  render: (args: Args) => React.ReactNode,
  component: unknown,
  args: Args = {},
) {
  return function Example({ variant }: { variant?: string }) {
    const node = render({ ...args, ...(variant ? { variant } : {}) });
    // An example that renders the component itself takes the variant too; one that composes several things cannot, and is drawn as it is.
    return (
      <ExampleBoundary>
        {variant && React.isValidElement(node) && node.type === component ? React.cloneElement(node as React.ReactElement<Args>, { variant }) : node}
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

  const examplesPath = find(examples, name);
  if (examplesPath) {
    const raw = (await texts[examplesPath]?.()) as string | undefined;
    const exampleName = raw ? exampleNames(raw)[0] : undefined;
    const module = (await examples[examplesPath]()) as Record<string, unknown>;
    const run = exampleName
      ? (module[exampleName] as ((props: Args) => React.ReactNode) | undefined)
      : undefined;
    if (run)
      return {
        Example: exampleOf(() => run({}), component),
        variants,
        example: raw && exampleName ? exampleCode(raw, exampleName) : null,
      };
  }

  // No written example: the engine composes one from the component's props.
  const composed = anatomyExample(composeExamples(name));
  if (!composed) return null;
  return {
    Example: exampleOf(() => toElement(composed.node, resolve, composed.printed.sources), component),
    variants,
    example: { name: composed.row.title, code: composed.printed.code, lineMap: composed.printed.lineMap },
  };
}
