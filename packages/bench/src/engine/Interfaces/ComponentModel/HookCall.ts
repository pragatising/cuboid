import type { Expr } from "./Expr";

/**
 * A hook called at the top of the component: `useState`, `useEffect`, `useRef`, `useContext`, `useId`, a custom hook. They are
 * kept in the order they are called. What a hook is for (state, an effect, a ref, a context) is not recorded; it follows from
 * which hook it is.
 */
export type HookCall = {
  /** As called: `useState`, `React.useEffect`, `useControllableState`. */
  hook: string;
  /** Where the hook comes from, when it is imported. */
  from?: string;
  /** Where it is written, when it is a function in this project: `src/…/useFieldControl.ts#useFieldControl`. */
  declared?: string;
  arguments: Expr[];
  /** The names bound from its result, in order: `const [on, setOn] = useState(…)` binds `on` and `setOn`. None for `useEffect`. */
  binds: string[];
};
