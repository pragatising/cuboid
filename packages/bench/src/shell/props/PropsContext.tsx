import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentDoc, Node, Value } from "../../engine/types";
import type { Overrides } from "./overrides";
import type { ExampleTree } from "../../engine/example";

/** The instance the pane is for: the use of the component whose example it is. Another instance of the example is addressed by its id in the example's tree. */
export const MAIN = "main";

/** What the Playground tells the pane: which component's example it is drawing, from which node, and the engine's reading of its props. */
export type PlayBase = {
  component: string;
  doc: ComponentDoc;
  node: Node;
  /**
   * What the changes are kept for: the Playground's one example is the component's own, and each framed example of the Examples view is its own,
   * so selecting another frame shows its changes and leaves the first frame as it was set. Defaults to the component.
   */
  scope?: string;
  /** What the example writes as elements, as the code has it, by prop (`children`, `trigger`…): shown as the code in place of a type. */
  written?: Record<string, string>;
  /** What the example says, as a tree: its instances are what the pane can be pointed at (each of three items has its own props). Without one, only the component itself can be changed. */
  tree?: ExampleTree;
};

type PropsState = {
  base: PlayBase | null;
  setBase: (base: PlayBase | null) => void;
  /** What the pane has changed from the example it is on (the scope selected), and what is set back. */
  overrides: Overrides;
  /** What was changed in another scope (a frame that is not selected, still drawn with its changes), or nothing. Stable until that changes. */
  overridesOf: (scope: string) => Overrides | undefined;
  /** What was changed in an instance of the example (the main one, or one by its id in the tree), in the scope selected. */
  overridesAt: (instance: string) => Overrides;
  /** Everything changed in a scope, by instance: what the example's code is printed with. */
  editsOf: (scope: string) => Record<string, Overrides> | undefined;
  change: (name: string, value: Value | undefined) => void;
  /** The same, for an instance of the example other than the main one. */
  changeAt: (instance: string, name: string, value: Value | undefined) => void;
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
  const [store, setStore] = useState<Record<string, Record<string, Overrides>>>({});
  // The component the kept changes are for: another component's are gone, and a pause with nothing selected does not lose these.
  const owner = useRef<string | null>(null);
  const scope = base ? (base.scope ?? base.component) : null;

  const setBase = useCallback((next: PlayBase | null) => {
    if (next && owner.current !== next.component) {
      owner.current = next.component;
      setStore({});
    }
    setBaseState(next);
  }, []);
  const changeAt = useCallback(
    (instance: string, name: string, value: Value | undefined) => {
      if (scope !== null) setStore((all) => ({ ...all, [scope]: { ...all[scope], [instance]: { ...all[scope]?.[instance], [name]: value } } }));
    },
    [scope],
  );
  const change = useCallback((name: string, value: Value | undefined) => changeAt(MAIN, name, value), [changeAt]);
  const reset = useCallback(() => {
    if (scope !== null) setStore((all) => ({ ...all, [scope]: {} }));
  }, [scope]);
  const overridesOf = useCallback((of: string) => store[of]?.[MAIN], [store]);
  const editsOf = useCallback((of: string) => store[of], [store]);
  const overridesAt = useCallback((instance: string) => (scope !== null ? store[scope]?.[instance] : undefined) ?? NONE, [store, scope]);

  const overrides = (scope !== null ? store[scope]?.[MAIN] : undefined) ?? NONE;
  const value = useMemo(
    () => ({ base, setBase, overrides, overridesOf, overridesAt, editsOf, change, changeAt, reset }),
    [base, setBase, overrides, overridesOf, overridesAt, editsOf, change, changeAt, reset],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

const NONE: Overrides = {};

/** The state a Playground and its pane share, or null outside a Provider. */
export const useProps = () => useContext(Context);
