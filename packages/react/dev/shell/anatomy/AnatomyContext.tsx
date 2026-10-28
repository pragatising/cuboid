import React, { createContext, useContext, useMemo, useState } from "react";

import type { ExampleCode } from "./exampleSource";

/** A place in the example's file: a line (1-based) and a column (0-based), as Babel counts. */
export type Position = { line: number; column: number };
/** A piece of the example, from `from` up to but not including `to`. */
export type SourceRange = { from: Position; to: Position };
/** What to mark in the example's code: one or more pieces. */
export type Highlight = SourceRange[];

type AnatomyState = {
  /** The example the canvas is drawn from, as code. */
  example: ExampleCode | null;
  setExample: (example: ExampleCode | null) => void;
  /** The piece of the example that wrote the part under the pointer, if it has one. */
  hover: Highlight | null;
  setHover: (highlight: Highlight | null) => void;
  /** Whether the canvas draws a box over every named part ("Show Structure"). The switch is in the canvas header, the boxes on the stage. */
  structure: boolean;
  setStructure: (on: boolean) => void;
};

const Context = createContext<AnatomyState | null>(null);

/** What the canvas and the right pane share while looking at a component's anatomy: its example's code and what is hovered. */
export function AnatomyProvider({ children }: { children: React.ReactNode }) {
  const [example, setExample] = useState<ExampleCode | null>(null);
  const [hover, setHover] = useState<Highlight | null>(null);
  const [structure, setStructure] = useState(false);
  const value = useMemo(
    () => ({ example, setExample, hover, setHover, structure, setStructure }),
    [example, hover, structure],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAnatomy(): AnatomyState {
  const value = useContext(Context);
  if (!value) throw new Error("useAnatomy needs an AnatomyProvider");
  return value;
}

const RANGE = /^(\d+):(\d+)-(\d+):(\d+)$/;

function parseRange(text: string): SourceRange | null {
  const match = RANGE.exec(text);
  if (!match) return null;
  const [, fromLine, fromColumn, toLine, toColumn] = match.map(Number);
  return {
    from: { line: fromLine, column: fromColumn },
    to: { line: toLine, column: toColumn },
  };
}

/**
 * What `data-src` says (see dev/storySource.ts), as the pieces to mark. An element written on one line is marked whole, text
 * and all (`<Item>Edit</Item>`); one that spans lines is marked at its two tags only, since what is between them is its
 * children's own.
 */
export function parseSource(text: string | null | undefined): Highlight | null {
  if (!text) return null;
  const [opening, closing] = text.split(";").map(parseRange);
  if (!opening) return null;
  if (!closing) return [opening];
  return opening.from.line === closing.to.line
    ? [{ from: opening.from, to: closing.to }]
    : [opening, closing];
}
