import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  EmptyState,
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
import { StatesView } from "./states/StatesView";
import { useRoute } from "./useRoute";

const VIEWS = [
  { id: "states", label: "States" },
  { id: "anatomy", label: "Anatomy" },
  { id: "example", label: "Example" },
];

const VIEW_NOTES: Record<
  string,
  { icon: "touch_app" | "account_tree" | "code"; text: string }
> = {
  states: {
    icon: "touch_app",
    text: "Every state side by side, forced, with what drives each: next up.",
  },
  anatomy: {
    icon: "account_tree",
    text: "The parts it is made of, and where your props land.",
  },
  example: { icon: "code", text: "Examples, from the stories, later." },
};

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

  useEffect(() => {
    document.title = `${selected} · Cuboid shell`;
  }, [selected]);

  const matching = (name: string) =>
    name.toLowerCase().includes(query.trim().toLowerCase());
  const note = VIEW_NOTES[view];

  return (
    <Box
      flexDirection="row"
      height="100vh"
      overflow="hidden"
      backgroundColor="canvas.default"
      data-component="Shell"
    >
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
        <Box flexDirection="row" flexGrow={1} minHeight="0">
          <Box
            as="main"
            tabIndex={0}
            aria-label="States and views"
            flexDirection="column"
            flexGrow={1}
            minWidth="0"
            gap="2x"
            padding="2x"
            backgroundColor="canvas.subtle"
            overflow="auto"
            data-component="Shell.Canvas"
          >
            <VisuallyHidden as="h1">{selected}</VisuallyHidden>
            {/* The view switch and, in Anatomy, the structure switch: one row, as in the Figma frame. */}
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              gap="2x"
            >
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
              {view === "anatomy" ? (
                <Switch
                  label="Show Structure"
                  checked={structure}
                  onCheckedChange={setStructure}
                />
              ) : null}
            </Box>
            {view === "states" ? (
              <StatesView component={selected} />
            ) : view === "anatomy" ? (
              <AnatomyView component={selected} />
            ) : (
              <Box flexGrow={1} alignItems="center" justifyContent="center">
                <EmptyState
                  icon={note.icon}
                  heading={`${selected}: ${VIEWS.find((v) => v.id === view)?.label}`}
                  description={note.text}
                />
              </Box>
            )}
          </Box>
          <RightPane context={{ component: selected, view }} />
        </Box>
      </Box>
    </Box>
  );
}

/** The shell, with what its canvas and right pane share while looking at a component's anatomy. */
export function Shell() {
  return (
    <AnatomyProvider>
      <ShellFrame />
    </AnatomyProvider>
  );
}
