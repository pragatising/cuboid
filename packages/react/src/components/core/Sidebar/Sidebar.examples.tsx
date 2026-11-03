import { useState } from "react";
import { Box, Icon, Sidebar, Text } from "@sragatiping/cuboid";
import type { Frame } from "@sragatiping/bench/example";

/** The rail takes the height of what it is in, so each example gives it a box to fill. */
function Rail({ children }: { children: React.ReactNode }) {
  return <Box style={{ height: 360 }}>{children}</Box>;
}

export function Default() {
  return (
    <Rail>
      <Sidebar aria-label="Components" width="sm">
        <Sidebar.Header>Cuboid</Sidebar.Header>
        <Sidebar.Body>
          <Sidebar.Section label="Primitives">
            <Sidebar.Item href="#button" current>Button</Sidebar.Item>
            <Sidebar.Item href="#text">Text</Sidebar.Item>
            <Sidebar.Item href="#box">Box</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section label="Layout">
            <Sidebar.Item href="#container">Container</Sidebar.Item>
            <Sidebar.Item href="#sidebar">Sidebar</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar>
    </Rail>
  );
}
Default.frame = { height: 380 } satisfies Frame;

/** The header, the body and the footer, top to bottom. Collapse it to see what the rail keeps: the icons. */
export function WithIconsAndFooter() {
  return (
    <Rail>
      <Sidebar aria-label="Workspace" width="sm">
        <Sidebar.Header leadingVisual={<Icon name="workspaces" />}>Acme Inc</Sidebar.Header>
        <Sidebar.Body>
          <Sidebar.Section label="Workspace">
            <Sidebar.Item href="#home" current leadingVisual={<Icon name="home" size="sm" />}>Home</Sidebar.Item>
            <Sidebar.Item href="#inbox" leadingVisual={<Icon name="inbox" size="sm" />} trailingVisual={<Icon name="chevron_right" size="sm" />}>Inbox</Sidebar.Item>
            <Sidebar.Item href="#settings" leadingVisual={<Icon name="settings" size="sm" />}>Settings</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Sidebar.Item href="#help" leadingVisual={<Icon name="help" size="sm" />}>Help</Sidebar.Item>
        </Sidebar.Footer>
      </Sidebar>
    </Rail>
  );
}
WithIconsAndFooter.frame = { height: 380 } satisfies Frame;

export function Collapsed() {
  return (
    <Rail>
      <Sidebar aria-label="Workspace" defaultCollapsed>
        <Sidebar.Header leadingVisual={<Icon name="workspaces" />}>Acme Inc</Sidebar.Header>
        <Sidebar.Body>
          <Sidebar.Section label="Workspace">
            <Sidebar.Item href="#home" current leadingVisual={<Icon name="home" size="sm" />}>Home</Sidebar.Item>
            <Sidebar.Item href="#inbox" leadingVisual={<Icon name="inbox" size="sm" />}>Inbox</Sidebar.Item>
            <Sidebar.Item href="#settings" leadingVisual={<Icon name="settings" size="sm" />}>Settings</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar>
    </Rail>
  );
}
Collapsed.frame = { height: 380 } satisfies Frame;

export function Controlled() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Rail>
      <Box flexDirection="row" style={{ height: "100%" }}>
        <Sidebar aria-label="Workspace" collapsed={collapsed} onCollapsedChange={setCollapsed}>
          <Sidebar.Header toggle={false}>Acme Inc</Sidebar.Header>
          <Sidebar.Body>
            <Sidebar.Section label="Workspace">
              <Sidebar.Item href="#home" current leadingVisual={<Icon name="home" size="sm" />}>Home</Sidebar.Item>
              <Sidebar.Item href="#inbox" leadingVisual={<Icon name="inbox" size="sm" />}>Inbox</Sidebar.Item>
            </Sidebar.Section>
          </Sidebar.Body>
          <Sidebar.Footer>
            <Sidebar.Toggle />
          </Sidebar.Footer>
        </Sidebar>
        <Box padding="3x"><Text color="neutral.muted">{collapsed ? "Collapsed" : "Expanded"}</Text></Box>
      </Box>
    </Rail>
  );
}
Controlled.frame = { height: 380 } satisfies Frame;

export function Resizable() {
  return (
    <Rail>
      <Sidebar aria-label="Workspace" resizable>
        <Sidebar.Header>Drag the edge</Sidebar.Header>
        <Sidebar.Body>
          <Sidebar.Section label="Workspace">
            <Sidebar.Item href="#home" current>Home</Sidebar.Item>
            <Sidebar.Item href="#inbox">Inbox</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar>
    </Rail>
  );
}
Resizable.frame = { height: 380 } satisfies Frame;

export function OnTheRight() {
  return (
    <Rail>
      <Box flexDirection="row-reverse" style={{ height: "100%" }}>
        <Sidebar aria-label="Details" edge="right" width="sm">
          <Sidebar.Header>Details</Sidebar.Header>
          <Sidebar.Body>
            <Sidebar.Section label="Properties">
              <Sidebar.Item href="#owner">Owner</Sidebar.Item>
              <Sidebar.Item href="#tags">Tags</Sidebar.Item>
            </Sidebar.Section>
          </Sidebar.Body>
        </Sidebar>
      </Box>
    </Rail>
  );
}
OnTheRight.frame = { height: 380 } satisfies Frame;
