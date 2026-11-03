import type { ComponentType } from "react";
import type { Frame } from "../example";
import { exampleSources, examples } from "virtual:bench";

/** The examples someone wrote for a component, in `Name.examples.tsx` beside it: its exports that are function components. */
export type ExampleModule = Record<string, unknown>;
export type { Frame };
export type Example = { name: string; Example: ComponentType; frame: Frame };

/** An example function, with the frame it may have been given. */
export type ExampleComponent = ComponentType & { frame?: Frame };

type Files<T> = Record<string, () => Promise<T>>;

/** The file of a component's examples, found by name wherever in the package it is (the paths are the glob's). */
function fileOf<T>(component: string, files: Files<T>): (() => Promise<T>) | undefined {
  return Object.entries(files).find(([path]) => path.split("/").pop() === `${component}.examples.tsx`)?.[1];
}

/** What an example is called on its frame: the export's name, as words (`SignInNeeded` is "Sign in needed"). */
export function humanize(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

/**
 * The examples a module holds: each export that is a function component, in the order they are written. A module's exports have no order
 * of their own (they come sorted by name), so the order is read from the file's text, and an export it does not find goes last.
 */
export function examplesIn(module: ExampleModule, source = ""): Example[] {
  const written = (name: string) => {
    const at = source.search(new RegExp(`export\\s+(?:async\\s+)?(?:function\\*?|const|class)\\s+${name}\\b`));
    return at < 0 ? Number.POSITIVE_INFINITY : at;
  };
  return Object.entries(module)
    .filter(([, value]) => typeof value === "function")
    .map(([name, value]) => ({ name, Example: value as ComponentType, frame: (value as ExampleComponent).frame ?? {} }))
    .sort((a, b) => written(a.name) - written(b.name));
}

/** A component's examples in the order written, or undefined when it has no examples file. */
export async function loadExamples(component: string, files: Files<ExampleModule> = examples, sources: Files<string> = exampleSources): Promise<Example[] | undefined> {
  const load = fileOf(component, files);
  if (!load) return undefined;
  const read = fileOf(component, sources);
  return examplesIn(await load(), await read?.());
}

/** Whether a component has an examples file, without loading it. */
export const hasExamples = (component: string, files: Files<ExampleModule> = examples): boolean => fileOf(component, files) !== undefined;

/** The text of a component's examples file, or undefined when it has none. */
export async function loadExampleSource(component: string, sources: Files<string> = exampleSources): Promise<string | undefined> {
  return fileOf(component, sources)?.();
}
