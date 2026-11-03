import React, { createContext, useContext } from "react";

/** A request to look at one file of a component's source: the page it is on, the file, and a count so that asking again for the same file is heard. */
export type SourceRequest = { component: string; file: string; count: number };

type SourceState = {
  /** The last file asked for, or null. */
  request: SourceRequest | null;
  /** Go to a component's page, in the Component view, with this file open in its source. */
  open: (component: string, file: string) => void;
  /** Go to a component's own page, in the Anatomy view (what a page opens on). */
  goto: (component: string) => void;
};

const Context = createContext<SourceState | null>(null);

export function SourceProvider({ value, children }: { value: SourceState; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** What links to a component's source use, or null outside the shell (a link then goes nowhere). */
export const useSource = () => useContext(Context);
