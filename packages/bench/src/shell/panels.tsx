import React from "react";
import { EmptyState } from "../ui/index";
import type { Highlight } from "./anatomy/AnatomyContext";
import type { ExampleCode as Example } from "./anatomy/exampleSource";
import { AnatomyCode } from "./code/ShellCode";
import { FrameFacts } from "./canvas/FrameFacts";
import { PropsList } from "./props";

/** What a panel is told about the page being looked at. It will grow (the component's props, its rendered DOM…). */
export type PanelContext = {
  component: string;
  /** Which view of the canvas is showing (`anatomy`, `component`, `examples`; `composition` on its own page). */
  view: string;
  /** The frame selected on the canvas, by its id. */
  frame: string | null;
  /** The example code of the Anatomy view and the lines of the part under the pointer, once it has loaded. */
  anatomy: { example: Example | null; hover: Highlight | null };
};

export type Panel = {
  id: string;
  title: string;
  /** Hides the panel while it has nothing to say for this view. */
  visible?: (context: PanelContext) => boolean;
  /** Draws its own well, so it is not put in the pane's. */
  bare?: boolean;
  /** 16px at its sides, as Code has in the Figma, not the 8px of the others. */
  wide?: boolean;
  render: (context: PanelContext) => React.ReactNode;
};
/** `visible` hides a whole group while it has nothing to say. */
export type PanelGroup = {
  id: string;
  title: string;
  panels: Panel[];
  visible?: (context: PanelContext) => boolean;
};

const notWired = (what: string) => (
  <EmptyState
    layout="compact"
    icon="construction"
    description={`Not wired yet: ${what}`}
  />
);

/**
 * The right pane, as data. Add a panel by adding an entry (or a group, for a new heading such as Tokens or Accessibility): the
 * pane itself never changes. Properties and Code are the sections built so far.
 */
export const PANEL_GROUPS: PanelGroup[] = [
  {
    id: "design",
    title: "Design",
    panels: [
      {
        // The frame selected, above its example: the screen it is on, and its size.
        id: "frame",
        title: "Frame",
        bare: true,
        visible: ({ view, frame }) => view === "examples" && frame !== null,
        render: ({ frame }) => (frame ? <FrameFacts id={frame} /> : null),
      },
      {
        // Read only (the types) until something is being played with: the Playground's example, or a frame selected on the canvas.
        id: "properties",
        title: "Properties",
        bare: true,
        visible: ({ view }) => view !== "composition",
        render: ({ component }) => <PropsList component={component} />,
      },
      {
        // A composition is drawn from this: its JSON.
        id: "composition-schema",
        title: "Schema (JSON)",
        visible: ({ view }) => view === "composition",
        render: ({ anatomy }) =>
          anatomy.example ? (
            <AnatomyCode example={anatomy.example} hover={null} />
          ) : null,
      },
      {
        // The component written out, whatever is selected: what its states are states of.
        id: "component-code",
        wide: true,
        title: "Code",
        visible: ({ view, anatomy }) => view === "component" && anatomy.example !== null,
        render: ({ anatomy }) => (anatomy.example ? <AnatomyCode example={anatomy.example} hover={null} /> : null),
      },
      {
        // The example of the frame selected on the canvas, as someone wrote it, with what is changed in the pane written in.
        id: "example-code",
        wide: true,
        title: "Code",
        visible: ({ view, anatomy }) => view === "examples" && anatomy.example !== null,
        render: ({ anatomy }) => (anatomy.example ? <AnatomyCode example={anatomy.example} hover={null} /> : null),
      },
    ],
  },
  {
    // In Anatomy the pane shows how the example is written: hover a part on the canvas and its lines are marked.
    id: "anatomy",
    title: "Anatomy",
    visible: ({ view }) => view === "anatomy",
    panels: [
      {
        id: "example",
        title: "Example",
        render: ({ anatomy }) =>
          anatomy.example ? (
            <AnatomyCode example={anatomy.example} hover={anatomy.hover} />
          ) : (
            notWired("the example's code")
          ),
      },
    ],
  },
];
