import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Header,
  Icon,
  IconButton,
  InputText,
  SegmentedControl,
  Sidebar,
  Switch,
  Text,
  VisuallyHidden,
} from "../../src";
import pkg from "../../package.json";
import { buildNav } from "./nav";
import { RightPane } from "./panels";
import { AnatomyProvider, useAnatomy } from "./anatomy/AnatomyContext";
import { AnatomyView } from "./anatomy/AnatomyView";
import { Canvas } from "./canvas/Canvas";
import { ErrorBoundary } from "./ErrorBoundary";
import { Device } from "./canvas/Device";
import type { DeviceId } from "./canvas/Device";
import { DevicePicker } from "./canvas/DevicePicker";
import { CompositionView } from "./composition/CompositionView";
import { TEMPLATES } from "./composition/templates";
import { CheckPreview, checkTemplate } from "./issues/check";
import { OverviewView } from "./overview/OverviewView";
import { PlaygroundView } from "./playground/PlaygroundView";
import { PropsProvider } from "./props/PropsContext";
import { StatesView } from "./states/StatesView";
import { useRoute } from "./useRoute";

/** The page that lists every component, not one of them. */
const OVERVIEW = "Overview";
/** The page of ready-made compositions. */
const COMPOSITION = "Composition";

const VIEWS = [
  { id: "states", label: "States" },
  { id: "anatomy", label: "Anatomy" },
  { id: "playground", label: "Playground" },
];

/** The colour mark before the version, as in the frame. Cuboid has no Avatar yet. */
function Mark() {
  return (
    <Box
      as="span"
      aria-hidden="true"
      width="20px"
      height="20px"
      borderRadius="full"
      backgroundColor="#e34848"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Text as="span" size="sm" weight="medium" color="neutral.inverted">
        C
      </Text>
    </Box>
  );
}

/**
 * A page that is a canvas: the canvas fills it, and the controls (what is shown, the device) float over its top, with no bar of their
 * own, so what is on the canvas can be moved under them, as in Figma. Only the controls take the pointer; the rest of the strip is the canvas.
 */
function CanvasPage({
  label,
  heading,
  left,
  right,
  children,
}: {
  label: string;
  heading?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="main"
      aria-label={label}
      position="relative"
      flexGrow={1}
      minWidth="0"
      minHeight="0"
      backgroundColor="canvas.subtle"
    >
      <VisuallyHidden as="h1">{heading ?? label}</VisuallyHidden>
      <Box position="absolute" top={0} left={0} right={0} bottom={0}>
        {children}
      </Box>
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={5}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap="2x"
        padding="2x"
        style={{ pointerEvents: "none" }}
      >
        <Box style={{ pointerEvents: "auto" }}>{left}</Box>
        <Box
          flexDirection="row"
          alignItems="center"
          gap="2x"
          style={{ pointerEvents: "auto" }}
        >
          {right}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The experimental docs shell (Figma frame 3302:16146): a sidebar of components, a header, a canvas with its views, and a
 * right pane of panels. It is built from Cuboid itself, and what it lacks (Tabs, Avatar) is the system's backlog showing.
 */
function ShellFrame() {
  const nav = useMemo(() => buildNav(), []);
  const first = nav[0]?.items[0]?.name ?? "";
  const [selected, select] = useRoute(first);
  const [view, setView] = useState("states");
  const { structure, setStructure } = useAnatomy();
  const [query, setQuery] = useState("");
  // The screen content is shown on: the views have their own (none until chosen), a composition is shown on its template's.
  const [device, setDevice] = useState<DeviceId>("none");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const [compositionDevice, setCompositionDevice] = useState<DeviceId | null>(
    null,
  );

  useEffect(() => {
    document.title = `${selected} · Cuboid shell`;
  }, [selected]);

  const matching = (name: string) =>
    name.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <Box
      flexDirection="row"
      height="100vh"
      overflow="hidden"
      backgroundColor="canvas.default"
      data-component="Shell"
    >
      <CheckPreview />
      <Sidebar aria-label="Components" width="sm">
        <Sidebar.Header leadingVisual={<Mark />}>
          cuboid@{pkg.version}
        </Sidebar.Header>
        <Sidebar.Body>
          <InputText
            aria-label="Search components"
            placeholder="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leadingVisual={<Icon name="search" />}
          />
          <Sidebar.Item
            href={`#/${OVERVIEW}`}
            current={selected === OVERVIEW}
            leadingVisual={<Icon name="dashboard" />}
            onClick={() => select(OVERVIEW)}
          >
            Overview
          </Sidebar.Item>
          <Sidebar.Item
            href={`#/${COMPOSITION}`}
            current={selected === COMPOSITION}
            leadingVisual={<Icon name="dashboard_customize" />}
            onClick={() => select(COMPOSITION)}
          >
            Composition
          </Sidebar.Item>
          {nav.map((section) => {
            const items = section.items.filter((item) => matching(item.name));
            return items.length === 0 ? null : (
              <Sidebar.Section key={section.id} label={section.label}>
                {items.map((item) => (
                  <Sidebar.Item
                    key={item.name}
                    href={`#/${encodeURIComponent(item.name)}`}
                    current={item.name === selected}
                    onClick={() => select(item.name)}
                  >
                    {item.name}
                  </Sidebar.Item>
                ))}
              </Sidebar.Section>
            );
          })}
        </Sidebar.Body>
      </Sidebar>

      <Box flexDirection="column" flexGrow={1} minWidth="0">
        {selected === OVERVIEW ? (
          <Box
            as="main"
            aria-label="Overview"
            flexGrow={1}
            minHeight="0"
            overflow="auto"
            backgroundColor="canvas.subtle"
            tabIndex={0}
          >
            <ErrorBoundary resetKey="overview">
              <OverviewView />
            </ErrorBoundary>
          </Box>
        ) : selected === COMPOSITION ? (
          <Box flexDirection="row" flexGrow={1} minHeight="0">
            <CanvasPage
              label="Composition"
              right={
                <DevicePicker
                  value={compositionDevice ?? template.device}
                  onChange={setCompositionDevice}
                />
              }
            >
              <Canvas key="composition" label="Compositions">
                <ErrorBoundary resetKey="composition">
                  <CompositionView
                    templates={TEMPLATES}
                    selectedId={template.id}
                    onSelect={setTemplateId}
                    device={compositionDevice}
                  />
                </ErrorBoundary>
              </Canvas>
            </CanvasPage>
            <RightPane
              context={{ component: COMPOSITION, view: "composition" }}
              issues={{
                check: () => checkTemplate(template),
                forgetKey: `template:${template.id}`,
              }}
            />
          </Box>
        ) : (
          <Box flexDirection="row" flexGrow={1} minHeight="0">
            <CanvasPage
              label="States and views"
              heading={selected}
              left={
                <SegmentedControl
                  aria-label="View"
                  value={view}
                  onValueChange={setView}
                >
                  {VIEWS.map((v) => (
                    <SegmentedControl.Item key={v.id} value={v.id}>
                      {v.label}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl>
              }
              right={
                <>
                  {view === "anatomy" ? (
                    <Switch
                      label="Show Structure"
                      checked={structure}
                      onCheckedChange={setStructure}
                    />
                  ) : null}
                  <DevicePicker value={device} onChange={setDevice} />
                </>
              }
            >
              <Canvas
                key={`${selected}:${view}`}
                label={`${selected}: ${view}`}
              >
                {/* A frame of a stated width for the Playground (what fills its container fills it); the others fit their content. */}
                <ErrorBoundary resetKey={`${selected}:${view}`}>
                  <Device
                    device={device}
                    url={`localhost:3000/${selected}`}
                    frameWidth={view === "playground" ? 720 : null}
                  >
                    {view === "states" ? (
                      <StatesView component={selected} />
                    ) : view === "anatomy" ? (
                      <AnatomyView component={selected} />
                    ) : (
                      <PlaygroundView component={selected} />
                    )}
                  </Device>
                </ErrorBoundary>
              </Canvas>
            </CanvasPage>
            <RightPane context={{ component: selected, view }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

/** The shell, with what its canvas and right pane share while looking at a component's anatomy. */
export function Shell() {
  return (
    // The last resort: whatever else fails, the page shows what, and not nothing.
    <ErrorBoundary heading="The shell could not be drawn">
      <AnatomyProvider>
        <PropsProvider>
          <ShellFrame />
        </PropsProvider>
      </AnatomyProvider>
    </ErrorBoundary>
  );
}
