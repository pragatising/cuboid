import React, { useState } from "react";
import {
  Box,
  EmptyState,
  Icon,
  IconButton,
  ResizeHandle,
  Tabs,
  Text,
} from "../ui/index";
import { useAnatomy } from "./anatomy/AnatomyContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { IssuesPanel } from "./issues/IssuesPanel";
import { PANEL_GROUPS } from "./panels";
import { SourceView } from "./source";
import type { PanelContext } from "./panels";

/** The rule between sections (Figma Divider, 10657:89706): 1px, gray 2, the pane's width. */
function Divider() {
  return <Box borderTop="subtle" flexShrink={0} role="separator" aria-hidden="true" />;
}

/**
 * A section of the pane (Figma 5090:186692): 8px around it and a 20px heading with 8px of its own, and the Divider that follows it. A bare
 * section holds content that draws its own box (the props' accordions); a wide one has 16px at its sides, as Code does; the others sit in a well.
 */
function PaneSection({
  title,
  bare,
  wide,
  children,
}: {
  title: string;
  bare?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <Box
        as="section"
        aria-label={title}
        flexDirection="column"
        gap={wide ? "1x" : "0.5x"}
        paddingBlock="1x"
        paddingInline={wide ? "2x" : "1x"}
        data-component="Shell.Panel"
      >
        <Text
          as="h2"
          size="sm"
          weight="semibold"
          color="neutral.contrast"
          style={{ padding: wide ? "0" : "2px 8px", lineHeight: wide ? "16px" : "20px" }}
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
      <Divider />
    </>
  );
}

/** The pane's width until it is dragged: the width of the Figma frame. */
const DEFAULT_WIDTH = 400;
/** The Component view's pane is source code, which wants more room (and keeps the width it is dragged to, apart from the other views'). */
const CODE_WIDTH = 560;
const MIN_WIDTH = 320;
const MAX_WIDTH = 960;

const COLLAPSED_WIDTH = 48;

type Tab = { id: string; label: string };
const TABS: Tab[] = [
  { id: "design", label: "Design" },
  { id: "usage", label: "Usage" },
  { id: "accessibility", label: "Accessibility" },
];
/** In the Component view the pane is the component's source: its files, and its tokens (Figma 5048:119969). */
const COMPONENT: Tab[] = [
  { id: "code", label: "Code" },
  { id: "tokens", label: "Tokens" },
];
/** In Examples the pane is about the example selected, and has the one tab (Figma 5048:119968). */
const INSPECT: Tab[] = [{ id: "inspect", label: "Inspect" }];

/**
 * The pane on the right: Design (every group, each a heading over its panels), Usage and Accessibility (Figma 5055:142504). Only the
 * content of Design changes with the view: in Anatomy it is the example's code, marked as a part is hovered. In Examples there is no
 * pane until a frame is selected, and then one tab, Inspect: the selected example's props and code. 400px wide and dragged by
 * its left edge, or collapsed to a 48px rail whose one button opens it again.
 */
export function RightPane({
  context: base,
  frame = null,
  issues,
}: {
  context: Pick<PanelContext, "component" | "view">;
  /** The frame selected on the canvas, by its id: Examples has no pane without one. */
  frame?: string | null;
  /** What the Accessibility tab checks, when it is not the component named (a composition). */
  issues?: {
    check: () => Promise<import("./issues/check").Checked>;
    forgetKey: string;
  };
}) {
  const { example, hover } = useAnatomy();
  const context: PanelContext = { ...base, frame, anatomy: { example, hover } };
  const [dragged, setDragged] = useState<Record<string, number>>({});
  const kind = base.view === "component" ? "code" : "default";
  const width = dragged[kind] ?? (kind === "code" ? CODE_WIDTH : DEFAULT_WIDTH);
  const setWidth = (next: number) => setDragged((was) => ({ ...was, [kind]: next }));
  const [chosen, setChosen] = useState("design");
  const [collapsed, setCollapsed] = useState(false);
  const tabs = base.view === "examples" ? INSPECT : base.view === "component" ? COMPONENT : TABS;
  const tab = tabs.find((candidate) => candidate.id === chosen) ?? tabs[0];
  if (base.view === "examples" && frame === null) return null;
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
          padding="1x"
          borderBottom={collapsed ? undefined : "subtle"}
          flexShrink={0}
        >
          {collapsed ? null : (
            <Tabs aria-label="Details" value={tab.id} onValueChange={setChosen}>
              {tabs.map((candidate) => (
                <Tabs.Tab key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </Tabs.Tab>
              ))}
            </Tabs>
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
            role="tabpanel"
            tabIndex={0}
            aria-label={tab.label}
            flexDirection="column"
            flexGrow={1}
            minHeight="0"
            overflowY="auto"
          >
            <ErrorBoundary
              layout="compact"
              heading="This panel could not be drawn"
              resetKey={`${base.component}:${base.view}:${tab.id}`}
            >
              {tab.id === "code" ? (
                <SourceView component={base.component} />
              ) : tab.id === "tokens" ? (
                <EmptyState layout="compact" icon="construction" description="Not wired yet: the tokens this component reads." />
              ) : tab.id === "accessibility" ? (
                <Box padding="2x">
                  <IssuesPanel component={base.component} {...issues} />
                </Box>
              ) : tab.id === "usage" ? (
                <EmptyState layout="compact" icon="article" description="Nothing written about how to use this yet." />
              ) : (
                PANEL_GROUPS.filter(
                  (group) => group.visible?.(context) ?? true,
                ).map((group) => (
                  <Box key={group.id} flexDirection="column" gap="1x" paddingBlockEnd="2x">
                    {group.panels
                      .filter((panel) => panel.visible?.(context) ?? true)
                      .map((panel) => (
                        <PaneSection
                          key={panel.id}
                          title={panel.title}
                          bare={panel.bare}
                          wide={panel.wide}
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
