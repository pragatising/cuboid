import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "../ui/index";
import { config, versions } from "virtual:bench";
import { buildNav } from "./nav";
import { RightPane } from "./RightPane";
import { AnatomyProvider, useAnatomy } from "./anatomy/AnatomyContext";
import { AnatomyView } from "./anatomy/AnatomyView";
import { Canvas } from "./canvas/Canvas";
import { ErrorBoundary } from "./ErrorBoundary";
import { Device } from "./canvas/Device";
import type { DeviceId } from "./canvas/Device";
import { DevicePicker } from "./canvas/DevicePicker";
import { FramesProvider } from "./canvas/FrameStore";
import { CompositionView } from "./composition/CompositionView";
import { TEMPLATES } from "./composition/templates";
import { ExamplesView } from "./examples/ExamplesView";
import { CheckPreview } from "./issues/CheckPreview";
import { checkTemplate } from "./issues/check";
import { OverviewView } from "./overview/OverviewView";
import { PropsProvider } from "./props/PropsContext";
import { SourceProvider } from "./source";
import type { SourceRequest } from "./source";
import { StatesView } from "./states/StatesView";
import { useRoute } from "./useRoute";

/** The page that lists every component, not one of them. */
const OVERVIEW = "Docs";
/** The page of ready-made compositions. */
const COMPOSITION = "Composition";

const VIEWS = [
  { id: "anatomy", label: "Anatomy" },
  { id: "component", label: "Component" },
  { id: "examples", label: "Examples" },
];

/** The colour mark before the version, as in the frame. The interface kit has no Avatar yet. */
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
 * right pane of panels. It is built from Bench's own interface kit, and what it lacks (Tabs, Avatar) is the kit's backlog showing.
 */
function ShellFrame() {
  const nav = useMemo(() => buildNav(), []);
  const first = nav[0]?.items[0]?.name ?? "";
  const [selected, select] = useRoute(first);
  const [view, setView] = useState("anatomy");
  const { structure, setStructure } = useAnatomy();
  const [query, setQuery] = useState("");
  // A composition is shown on its template's screen, or the one chosen for all of them. The views' frames each choose their own, in the pane.
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const [compositionDevice, setCompositionDevice] = useState<DeviceId | null>(
    null,
  );

  // What is selected on the canvas, for the right pane to know. It belongs to the canvas it was made on: another component or view is another canvas.
  const canvasKey = `${selected}:${view}`;
  const [picked, setPicked] = useState<{ key: string; id: string | null }>({ key: canvasKey, id: null });
  const frame = picked.key === canvasKey ? picked.id : null;
  const selectFrame = useCallback((id: string | null) => setPicked({ key: canvasKey, id }), [canvasKey]);

  // A link to a component's source (an instance in the Properties) opens its page in the Component view, with that file in the pane.
  const [request, setRequest] = useState<SourceRequest | null>(null);
  const openSource = useCallback(
    (component: string, file: string) => {
      select(component);
      setView("component");
      setRequest((was) => ({ component, file, count: (was?.count ?? 0) + 1 }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `select` only writes the URL hash
    [],
  );
  const gotoPage = useCallback(
    (component: string) => {
      select(component);
      setView("anatomy");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `select` only writes the URL hash
    [],
  );
  const sourceState = useMemo(() => ({ request, open: openSource, goto: gotoPage }), [request, openSource, gotoPage]);

  useEffect(() => {
    document.title = `${selected} · Bench`;
  }, [selected]);

  const matching = (name: string) =>
    name.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <SourceProvider value={sourceState}>
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
          {config.packages[0].name.replace(/^@[^/]+\//, "")}
          {versions[config.packages[0].name] ? `@${versions[config.packages[0].name]}` : ""}
        </Sidebar.Header>
        <Sidebar.Body>
          <InputText
            aria-label="Search components"
            placeholder="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leadingVisual={<Icon name="search" />}
          />
           <Sidebar.Section label="Overview">
             <Sidebar.Item
            href={`#/${OVERVIEW}`}
            current={selected === OVERVIEW}
            onClick={() => select(OVERVIEW)}
          >
            Overview
          </Sidebar.Item>
          <Sidebar.Item
            href={`#/${COMPOSITION}`}
            current={selected === COMPOSITION}
            onClick={() => select(COMPOSITION)}
          >
            Composition
          </Sidebar.Item>

           </Sidebar.Section>
         
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
          <FramesProvider key={canvasKey}>
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
                </>
              }
            >
              <Canvas
                key={canvasKey}
                label={`${selected}: ${view}`}
                selected={frame}
                onSelectedChange={selectFrame}
              >
                <ErrorBoundary resetKey={`${selected}:${view}`}>
                  {view === "examples" ? (
                    // Each example is a frame of its own, so the frames are not in one `Device`.
                    <ExamplesView component={selected} />
                  ) : (
                    <Device
                      device="none"
                      url={`localhost:3000/${selected}`}
                      // Anatomy is drawn in a frame that is a page of its own, so it has a width, as an Examples frame does; the States view still fits its content.
                      frameWidth={view === "anatomy" ? 560 : null}
                    >
                      {view === "component" ? (
                        <StatesView component={selected} />
                      ) : (
                        <AnatomyView component={selected} />
                      )}
                    </Device>
                  )}
                </ErrorBoundary>
              </Canvas>
            </CanvasPage>
            <RightPane context={{ component: selected, view }} frame={frame} />
          </Box>
          </FramesProvider>
        )}
      </Box>
    </Box>
    </SourceProvider>
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
