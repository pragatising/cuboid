/** A name used in a piece of code, and where that name comes from. */
export type Reference = {
  name: string;
  origin:
    | {
        /** A name the component's parameter binds: a prop. */
        kind: "param";
      }
    | {
        /** A name a hook call returned: `on` and `setOn` from `useState`. */
        kind: "hook";
        hook: string;
      }
    | {
        /** Declared in the component's body: a function, a const. */
        kind: "local";
      }
    | {
        kind: "import";
        from: string;
      }
    | {
        /** Declared at the top of the file, outside the component. */
        kind: "module";
      }
    | {
        /** Not declared in the file: `window`, `Math`. */
        kind: "global";
      };
};
