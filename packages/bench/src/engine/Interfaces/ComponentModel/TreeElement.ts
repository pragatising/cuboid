import type { Child } from "./Child";
import type { Expr } from "./Expr";
import type { HostType } from "./HostType";

/** One element of what the component returns: (type, attributes, children). Named TreeElement so it is not the DOM's `Element`. */
export type TreeElement = {
  id: string;
  type:
    | {
        /** A lowercase tag: `<button>`. */
        kind: "host";
        host: HostType;
      }
    | {
        /** A reference to a component: `<Foo>`, `<Foo.Bar>`, `<Ctx.Provider>`. */
        kind: "component";
        name: string;
        /** Where it is imported from, if it is. */
        from?: string;
        /** Where it is written, when that is a component in this project: `src/…/ButtonBase.tsx#ButtonBase`. */
        declared?: string;
      }
    | {
        /** `<>…</>`. */
        kind: "fragment";
      };
  /**
   * In the order written, because the later of two that set the same name wins (`className="x" {...rest}` and
   * `{...rest} className="x"` differ).
   */
  attributes: (
    | {
        /** `className`, `aria-*`, `data-*`, `ref`, an event prop: a name and the code that sets it. */
        kind: "attribute";
        name: string;
        /** A string, or code in braces. Absent for a bare attribute (`<button disabled>`). */
        value?: string | Expr;
      }
    | {
        /** `{...rest}`: many attributes at once, with no names. */
        kind: "spread";
        value: Expr;
      }
  )[];
  children: Child[];
};
