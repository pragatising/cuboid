import React, { useState } from "react";
import {
  Box,
  EmptyState,
  Icon,
  IconButton,
  ResizeHandle,
  SegmentedControl,
  Text,
} from "../../src";
import { useAnatomy } from "./anatomy/AnatomyContext";
import type { Highlight } from "./anatomy/AnatomyContext";
import type { ExampleCode as Example } from "./anatomy/exampleSource";
import { ExampleCode } from "./anatomy/ExampleCode";
import { IssuesPanel } from "./issues/IssuesPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { PropsList } from "./props/PropsList";

/** What a panel is told about the page being looked at. It will grow (the component's props, its rendered DOM…). */
export type PanelContext = {
  component: string;
  /** Which view of the canvas is showing (`states`, `anatomy`…). */
  view: string;
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
 * pane itself never changes. Properties is the one section built so far; DOM and Playground come back when there is something to put in them.
 */
export const PANEL_GROUPS: PanelGroup[] = [
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
            <ExampleCode example={anatomy.example} marked={anatomy.hover} />
          ) : (
            notWired("the example's code")
          ),
      },
    ],
  },
  {
    id: "design",
    title: "Design",
    visible: ({ view }) => view !== "anatomy",
    panels: [
      {
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
            <ExampleCode example={anatomy.example} marked={null} />
          ) : null,
      },
      {
        // The Playground's one example, as code to copy; it will be editable.
        id: "playground-code",
        title: "Code",
        visible: ({ view }) => view === "playground",
        render: ({ anatomy }) =>
          anatomy.example ? (
            <ExampleCode example={anatomy.example} marked={null} />
          ) : null,
      },
    ],
  },
];

function PaneSection({
  title,
  bare,
  children,
}: {
  title: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="section"
      aria-label={title}
      flexDirection="column"
      gap="1x"
      data-component="Shell.Panel"
    >
      <Text
        as="h2"
        size="sm"
        weight="semibold"
        color="neutral.contrast"
        style={{ padding: "0.5rem" }}
      >
        {title}
      </Text>
      {bare ? (
        children
      ) : (
        <Box backgroundColor="canvas.subtle" borderRadius="md" padding="1x">
          {children}
        </Box>
      )}
    </Box>
  );
}

/** The pane's width until it is dragged: the width of the Figma frame. */
const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 320;
const MAX_WIDTH = 960;

const COLLAPSED_WIDTH = 48;

/**
 * The pane on the right: Specs (every group, each a heading over its panels) and Issues, on every view (Figma 3354:109752). Only the
 * content of Specs changes with the view: in Anatomy it is the example's code, marked as a part is hovered. 400px wide and dragged by
 * its left edge, or collapsed to a 48px rail whose one button opens it again.
 */
export function RightPane({
  context: base,
  issues,
}: {
  context: Pick<PanelContext, "component" | "view">;
  /** What the Issues tab checks, when it is not the component named (a composition). */
  issues?: {
    check: () => Promise<import("./issues/check").Checked>;
    forgetKey: string;
  };
}) {
  const { example, hover } = useAnatomy();
  const context: PanelContext = { ...base, anatomy: { example, hover } };
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [chosen, setChosen] = useState("specs");
  const [collapsed, setCollapsed] = useState(false);
  const tab = chosen;
  return (
    // The handle sits half outside the pane's edge, so the pane that scrolls is inside this one.
    <Box
      position="relative"
      width={`${collapsed ? COLLAPSED_WIDTH : width}px`}
      flexShrink={0}
      data-component="Shell.RightPane"
    >
      {collapsed ? null : (
        <ResizeHandle
          edge="left"
          value={width}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
          onValueChange={setWidth}
          aria-label="Resize details pane"
        />
      )}
      <Box
        as="aside"
        aria-label="Component details"
        height="100%"
        flexDirection="column"
        backgroundColor="canvas.default"
        borderLeft="subtle"
      >
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent={collapsed ? "center" : "space-between"}
          gap="1x"
          padding="1.5x"
          borderBottom={collapsed ? undefined : "subtle"}
          flexShrink={0}
        >
          {collapsed ? null : (
            <SegmentedControl
              aria-label="Details"
              value={tab}
              onValueChange={setChosen}
            >
              <SegmentedControl.Item value="specs">Specs</SegmentedControl.Item>
              <SegmentedControl.Item value="issues">
                Issues
              </SegmentedControl.Item>
            </SegmentedControl>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={collapsed ? "Expand details" : "Collapse details"}
            aria-expanded={!collapsed}
            icon={<Icon name={collapsed ? "dock_to_left" : "dock_to_right"} />}
            onClick={() => setCollapsed((was) => !was)}
          />
        </Box>
        {collapsed ? null : (
          <Box
            tabIndex={0}
            aria-label={tab === "issues" ? "Issues" : "Specs"}
            flexDirection="column"
            flexGrow={1}
            minHeight="0"
            overflowY="auto"
          >
            <ErrorBoundary
              layout="compact"
              heading="This panel could not be drawn"
              resetKey={`${base.component}:${base.view}:${tab}`}
            >
              {tab === "issues" ? (
                <Box padding="2x">
                  <IssuesPanel component={base.component} {...issues} />
                </Box>
              ) : (
                PANEL_GROUPS.filter(
                  (group) => group.visible?.(context) ?? true,
                ).map((group) => (
                  <Box
                    key={group.id}
                    flexDirection="column"
                    gap="2x"
                    padding="2x"
                  >
                    {group.panels
                      .filter((panel) => panel.visible?.(context) ?? true)
                      .map((panel) => (
                        <PaneSection
                          key={panel.id}
                          title={panel.title}
                          bare={panel.bare}
                        >
                          {panel.render(context)}
                        </PaneSection>
                      ))}
                  </Box>
                ))
              )}
            </ErrorBoundary>
          </Box>
        )}
      </Box>
    </Box>
  );
}
