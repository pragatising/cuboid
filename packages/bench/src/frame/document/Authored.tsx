import React, { useEffect, useState, useSyncExternalStore, type ComponentType } from "react";
import { loadExamples } from "../examples";
import { patchesVersion, subscribe } from "./patches";

/**
 * An example someone wrote, drawn by the page: it is code (a function component that imports the library), so it is loaded here, in the
 * page's own copy of React and the library, and not handed over as data. A failure to load throws, so the page's boundary says what went wrong.
 */
export function Authored({ component, example }: { component: string; example: string }) {
  // Drawn again, not loaded again, whenever the pane changes something on one of its instances.
  useSyncExternalStore(subscribe, patchesVersion);
  const [loaded, setLoaded] = useState<{ Example: ComponentType } | { error: Error } | null>(null);

  useEffect(() => {
    let current = true;
    setLoaded(null);
    loadExamples(component).then(
      (found) => {
        if (!current) return;
        const Example = found?.find((item) => item.name === example)?.Example;
        setLoaded(Example ? { Example } : { error: new Error(found ? `${component}.examples has no example called ${example}` : `${component} has no examples file`) });
      },
      (error: unknown) => current && setLoaded({ error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      current = false;
    };
  }, [component, example]);

  if (loaded && "error" in loaded) throw loaded.error;
  return loaded ? <loaded.Example /> : null;
}
