import React from "react";
import components from "../../generated/components.json";
import type { StoryCode } from "../anatomy/AnatomyContext";

/**
 * What the States view needs to draw a component. The variants are the values of its `variant` prop, read from its types
 * (generated/components.json, from `npm run build:components-json`). The example to draw is the component's own story (its
 * `Playground`, else `Default`, else the first one): a story's `render` is run as it is, so a component whose example is a
 * composition (a Header with its parts, a menu with its items) is drawn as that composition, not as an empty root.
 */
const stories = import.meta.glob("../../../src/components/**/*.stories.tsx");
/** The same files as text, for showing the code (the page imports them as modules, so this is a second, raw import). */
const texts = import.meta.glob("../../../src/components/**/*.stories.tsx", { query: "?raw", import: "default" });

type Args = Record<string, unknown>;
type Story = { args?: Args; render?: (args: Args, context: unknown) => React.ReactNode };
type StoryModule = { default: { component?: React.ComponentType<Args>; args?: Args } } & Record<string, unknown>;
type Documented = Record<string, { props: { name: string; kind: string; values?: string[] }[] }>;

export type PreviewSource = {
  /** An element to draw: the example, with `variant` applied when there is one. */
  Example: React.ComponentType<{ variant?: string }>;
  variants: string[];
  /** The code of the story being drawn, so Anatomy can show it. */
  story: StoryCode | null;
};

/** A story is everything from its `export const` line to the next export (or the end of the file), without trailing blank lines. */
function storyCode(text: string, name: string): StoryCode | null {
  const start = new RegExp(`^export const ${name}\\b`, "m").exec(text);
  if (!start) return null;
  const next = text.indexOf("\nexport ", start.index + 1);
  const code = text.slice(start.index, next === -1 ? undefined : next).trimEnd();
  return { name, code, firstLine: text.slice(0, start.index).split("\n").length };
}

export async function loadPreviewSource(name: string): Promise<PreviewSource | null> {
  const path = Object.keys(stories).find((key) => key.endsWith(`/${name}/${name}.stories.tsx`));
  if (!path) return null;
  const module = (await stories[path]()) as StoryModule;
  const { component, args: metaArgs = {} } = module.default;
  if (!component) return null;
  const storyName = module.Playground ? "Playground" : module.Default ? "Default" : Object.keys(module).find((key) => key !== "default");
  const story = (storyName ? module[storyName] : undefined) as Story | undefined;
  const raw = (await texts[path]?.()) as string | undefined;
  const Component = component;
  const variants = (components as Documented)[name]?.props.find((prop) => prop.name === "variant" && prop.kind === "enum")?.values ?? [];

  /** A component, so a story's `render` may use hooks. */
  function Example({ variant }: { variant?: string }) {
    const args = { ...metaArgs, ...story?.args, ...(variant ? { variant } : {}) };
    const node = story?.render ? story.render(args, { args }) : <Component {...args} />;
    // A story that renders the component itself takes the variant too; one that composes several things cannot, and is drawn as it is.
    return variant && React.isValidElement(node) && node.type === component ? React.cloneElement(node as React.ReactElement<Args>, { variant }) : <>{node}</>;
  }
  return { Example, variants, story: raw && storyName ? storyCode(raw, storyName) : null };
}
