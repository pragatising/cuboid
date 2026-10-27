import React from "react";
import { Box, EmptyState, Text } from "../../src";
import { useAnatomy } from "./anatomy/AnatomyContext";
import type { LineRange, StoryCode as Story } from "./anatomy/AnatomyContext";
import { StoryCode } from "./anatomy/StoryCode";

/** What a panel is told about the page being looked at. It will grow (the component's props, its rendered DOM…). */
export type PanelContext = {
  component: string;
  /** Which view of the canvas is showing (`states`, `anatomy`…). */
  view: string;
  /** The story code of the Anatomy view and the lines of the part under the pointer, once it has loaded. */
  anatomy: { story: Story | null; hover: LineRange | null };
};

export type Panel = { id: string; title: string; render: (context: PanelContext) => React.ReactNode };
/** `visible` hides a whole group while it has nothing to say. */
export type PanelGroup = { id: string; title: string; panels: Panel[]; visible?: (context: PanelContext) => boolean };

const notWired = (what: string) => <EmptyState layout="compact" icon="construction" description={`Not wired yet: ${what}`} />;

/**
 * The right pane, as data. Add a panel by adding an entry (or a group, for a new heading such as Tokens or Accessibility): the
 * pane itself never changes. The four below are the sections of the Figma frame; each one's content is the next piece of work.
 */
export const PANEL_GROUPS: PanelGroup[] = [
  {
    // In Anatomy the pane shows how the example was written: hover a part on the canvas and its lines are marked.
    id: "anatomy",
    title: "Anatomy",
    visible: ({ view }) => view === "anatomy",
    panels: [
      {
        id: "story",
        title: "Story",
        render: ({ anatomy }) => (anatomy.story ? <StoryCode story={anatomy.story} marked={anatomy.hover} /> : notWired("the story's code")),
      },
    ],
  },
  {
    id: "design",
    title: "Design",
    visible: ({ view }) => view !== "anatomy",
    panels: [
      { id: "properties", title: "Properties", render: () => notWired("the component's props, from its types") },
      { id: "playground", title: "Playground", render: ({ component }) => notWired(`the JSX for ${component}, editable`) },
      { id: "dom", title: "DOM", render: () => notWired("the HTML it renders, with the hashed classes removed") },
      { id: "dom-rendering", title: "DOM Rendering", render: () => notWired("that HTML as the browser lays it out") },
    ],
  },
];

function PaneSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box as="section" aria-label={title} flexDirection="column" gap="1x" data-component="Shell.Panel">
      <Text as="h3" size="sm" weight="semibold" color="neutral.contrast" style={{ padding: "0.5rem" }}>
        {title}
      </Text>
      <Box backgroundColor="canvas.subtle" borderRadius="md" padding="1x">
        {children}
      </Box>
    </Box>
  );
}

/** The pane on the right: every group, each a heading over its panels. */
export function RightPane({ context: base }: { context: Pick<PanelContext, "component" | "view"> }) {
  const { story, hover } = useAnatomy();
  const context: PanelContext = { ...base, anatomy: { story, hover } };
  return (
    <Box as="aside" tabIndex={0} aria-label="Component details" data-component="Shell.RightPane" width="560px" flexShrink={0} flexDirection="column" backgroundColor="canvas.default" borderLeft="subtle" overflowY="auto">
      {PANEL_GROUPS.filter((group) => group.visible?.(context) ?? true).map((group) => (
        <Box key={group.id} flexDirection="column" gap="2x" padding="2x">
          {group.panels.map((panel) => (
            <PaneSection key={panel.id} title={panel.title}>
              {panel.render(context)}
            </PaneSection>
          ))}
        </Box>
      ))}
    </Box>
  );
}
