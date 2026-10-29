import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ComponentDoc, Node, Value } from "../../engine/types";
import type { Overrides } from "./overrides";

/** What the Playground tells the pane: which component's example it is drawing, from which node, and the engine's reading of its props. */
export type PlayBase = { component: string; doc: ComponentDoc; node: Node };

type PropsState = {
  base: PlayBase | null;
  setBase: (base: PlayBase | null) => void;
  /** What the pane has changed from the example, and what is set back. */
  overrides: Overrides;
  change: (name: string, value: Value | undefined) => void;
  reset: () => void;
};

const Context = createContext<PropsState | null>(null);

/**
 * What the canvas and the right pane share while a component is being played with: the example, and what has been changed in it. The
 * pane changes it; the Playground draws the example with the changes, and its code follows. Changes are for one component: when another
 * is opened they are gone.
 */
export function PropsProvider({ children }: { children: React.ReactNode }) {
  const [base, setBaseState] = useState<PlayBase | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});

  const setBase = useCallback((next: PlayBase | null) => {
    setBaseState((current) => {
      if (current?.component !== next?.component) setOverrides({});
      return next;
    });
  }, []);
  const change = useCallback(
    (name: string, value: Value | undefined) =>
      setOverrides((all) => ({ ...all, [name]: value })),
    [],
  );
  const reset = useCallback(() => setOverrides({}), []);

  const value = useMemo(
    () => ({ base, setBase, overrides, change, reset }),
    [base, setBase, overrides, change, reset],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** The state a Playground and its pane share, or null outside a Provider. */
export const useProps = () => useContext(Context);
