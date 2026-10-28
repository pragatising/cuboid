import React from "react";
import * as library from "../../../src";
import components from "../../generated/components.json";
import { exampleCode, exampleNames } from "../anatomy/exampleSource";
import type { ExampleCode } from "../anatomy/exampleSource";

/**
 * What the States and Anatomy views need to draw a component. The variants are the values of its `variant` prop, read from its
 * types (generated/components.json, from `npm run build:components-json`).
 *
 * The example to draw is real usage: `Component.examples.tsx` next to the component, an ordinary function component written as
 * an app would write it (real imports, real hooks). Its first export is the default. It is run as it is, so a component whose
 * example is a composition (a Header with its parts, a menu with its items) is drawn as that composition. A component that has
 * no examples file yet is drawn from its Storybook story instead (its `Playground`, else `Default`, else the first one), until
 * its example is written.
 */
const examples = import.meta.glob("../../../src/components/**/*.examples.tsx");
const stories = import.meta.glob("../../../src/components/**/*.stories.tsx");
/** The same files as text, for showing the code (the page imports them as modules, so this is a second, raw import). */
const texts = import.meta.glob(
  [
    "../../../src/components/**/*.examples.tsx",
    "../../../src/components/**/*.stories.tsx",
  ],
  { query: "?raw", import: "default" },
);

type Args = Record<string, unknown>;
type Story = {
  args?: Args;
  render?: (args: Args, context: unknown) => React.ReactNode;
};
type StoryModule = {
  default: { component?: React.ComponentType<Args>; args?: Args };
} & Record<string, unknown>;
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

const find = (
  files: Record<string, unknown>,
  name: string,
  kind: "examples" | "stories",
) =>
  Object.keys(files).find((key) =>
    key.endsWith(`/${name}/${name}.${kind}.tsx`),
  );

/** A story is everything from its `export const` line to the next export (or the end of the file), without trailing blank lines. */
function storyCode(text: string, name: string): ExampleCode | null {
  const start = new RegExp(`^export const ${name}\\b`, "m").exec(text);
  if (!start) return null;
  const next = text.indexOf("\nexport ", start.index + 1);
  const code = text
    .slice(start.index, next === -1 ? undefined : next)
    .trimEnd();
  const firstLine = text.slice(0, start.index).split("\n").length;
  return { name, code, lineMap: code.split("\n").map((_, i) => firstLine + i) };
}

/** Draws `render()` (which may use hooks, since this is a component), giving the root the variant when it is the component itself. */
function exampleOf(
  render: (args: Args) => React.ReactNode,
  component: unknown,
  args: Args = {},
) {
  return function Example({ variant }: { variant?: string }) {
    const node = render({ ...args, ...(variant ? { variant } : {}) });
    // An example that renders the component itself takes the variant too; one that composes several things cannot, and is drawn as it is.
    return variant && React.isValidElement(node) && node.type === component ? (
      React.cloneElement(node as React.ReactElement<Args>, { variant })
    ) : (
      <>{node}</>
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

  const examplesPath = find(examples, name, "examples");
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

  const storiesPath = find(stories, name, "stories");
  if (!storiesPath) return null;
  const module = (await stories[storiesPath]()) as StoryModule;
  const { component: storyComponent, args: metaArgs = {} } = module.default;
  if (!storyComponent) return null;
  const storyName = module.Playground
    ? "Playground"
    : module.Default
      ? "Default"
      : Object.keys(module).find((key) => key !== "default");
  const story = (storyName ? module[storyName] : undefined) as
    Story | undefined;
  const raw = (await texts[storiesPath]?.()) as string | undefined;
  const Component = storyComponent;
  const render = (args: Args) =>
    story?.render ? story.render(args, { args }) : <Component {...args} />;
  return {
    Example: exampleOf(
      (variantArgs) => render({ ...metaArgs, ...story?.args, ...variantArgs }),
      storyComponent,
    ),
    variants,
    example: raw && storyName ? storyCode(raw, storyName) : null,
  };
}
