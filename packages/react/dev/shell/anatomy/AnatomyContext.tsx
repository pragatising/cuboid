import React, { createContext, useContext, useMemo, useState } from "react";

/** The story an Anatomy view is drawn from: its code, with the number of its first line in the file. */
export type StoryCode = { name: string; code: string; firstLine: number };
/** A range of lines in the story file, as `data-src` writes them. */
export type LineRange = { from: number; to: number };

type AnatomyState = {
  story: StoryCode | null;
  setStory: (story: StoryCode | null) => void;
  /** The lines of the part under the pointer, if it has any. */
  hover: LineRange | null;
  setHover: (range: LineRange | null) => void;
  /** Whether the canvas draws a box over every named part ("Show Structure"). The switch is in the canvas header, the boxes on the stage. */
  structure: boolean;
  setStructure: (on: boolean) => void;
};

const Context = createContext<AnatomyState | null>(null);

/** What the canvas and the right pane share while looking at a component's anatomy: its story code and what is hovered. */
export function AnatomyProvider({ children }: { children: React.ReactNode }) {
  const [story, setStory] = useState<StoryCode | null>(null);
  const [hover, setHover] = useState<LineRange | null>(null);
  const [structure, setStructure] = useState(false);
  const value = useMemo(
    () => ({ story, setStory, hover, setHover, structure, setStructure }),
    [story, hover, structure],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAnatomy(): AnatomyState {
  const value = useContext(Context);
  if (!value) throw new Error("useAnatomy needs an AnatomyProvider");
  return value;
}

/** `"12-14"` is lines 12 to 14. */
export function parseRange(text: string | null | undefined): LineRange | null {
  const match = /^(\d+)-(\d+)$/.exec(text ?? "");
  return match ? { from: Number(match[1]), to: Number(match[2]) } : null;
}
