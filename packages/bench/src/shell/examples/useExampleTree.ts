import { useEffect, useMemo, useState } from "react";
import apiJson from "~bench/generated/api.json";
import { config } from "virtual:bench";
import { componentResolver, exampleText, positionsOf, readExample } from "../../engine/example";
import { loadExampleSource } from "../../frame/examples";
import { MAIN } from "../props/PropsContext";
import type { Patches } from "../../frame/document/patches";

const sources = new Map<string, Promise<string | undefined>>();
/** The text of a component's examples file, read once. */
const sourceOf = (component: string) => {
  if (!sources.has(component)) sources.set(component, loadExampleSource(component));
  return sources.get(component)!;
};

/**
 * One example read as a tree: what it says (each element an instance, each tag the component the file imports it as), the first use of the component it is for,
 * and where each instance is written in the file, which is how the page drawing the real example finds it.
 */
export function useExampleTree(component: string, name: string | undefined) {
  const [source, setSource] = useState<string | undefined>();
  useEffect(() => {
    let current = true;
    void sourceOf(component).then((text) => current && setSource(text));
    return () => {
      current = false;
    };
  }, [component]);
  const written = useMemo(() => (name !== undefined && source !== undefined ? exampleText(source, name) : undefined), [name, source]);
  const tree = useMemo(() => {
    if (written === undefined || source === undefined) return undefined;
    const resolve = componentResolver({ fileSource: source, packages: config.packages.map((pkg) => pkg.name), known: (id) => id in (apiJson as Record<string, unknown>) });
    return readExample(written, resolve);
  }, [written, source]);
  const main = useMemo(() => tree?.instances.find((instance) => instance.component === component), [tree, component]);
  const positions = useMemo(() => (tree && source !== undefined ? positionsOf(tree, source) : {}), [tree, source]);
  return { source, written, tree, main, positions };
}

/** What the pane changed in an example, by where each instance is written: what the page needs to make the one element it is for. The main instance is the first use of the component. */
export function patchesOf(edits: Record<string, Patches[string]> | undefined, main: string | undefined, positions: Record<string, string>): Patches {
  const patches: Patches = {};
  for (const [key, changes] of Object.entries(edits ?? {})) {
    const place = positions[key === MAIN ? (main ?? key) : key];
    if (place && Object.keys(changes).length) patches[place] = changes;
  }
  return patches;
}
