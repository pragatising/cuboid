import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ActionMenuItem } from "../ActionMenu";
import { Button } from "../Button";
import { Icon, type IconName } from "../Icon";
import { SplitLayout } from "../SplitLayout";
import { Box } from "../Box";
import { Heading } from "../Heading";
import { Text } from "../Text";
import { Sidebar, useSidebar } from "./Sidebar";

function SidebarNavItem({
  label,
  icon,
  selected = false,
}: {
  label: string;
  icon: IconName;
  selected?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <ActionMenuItem
      iconOnly={collapsed}
      leadingIcon={<Icon size="sm" name={icon} />}
      selected={selected}
      showSelectionCheck={false}
      aria-label={collapsed ? label : undefined}
    >
      {label}
    </ActionMenuItem>
  );
}

function DockToggleIcon() {
  const { collapsed } = useSidebar();
  return <Icon name={collapsed ? "dock_to_left" : "dock_to_right"} />;
}

function NavRail() {
  const { collapsed } = useSidebar();

  return (
    <Box
      gap="xxs"
      alignItems={collapsed ? "center" : "stretch"}
      style={{ width: collapsed ? undefined : "100%" }}
    >
      <SidebarNavItem label="Home" icon="home" selected />
      <SidebarNavItem label="Settings" icon="settings" />
    </Box>
  );
}

function SidebarContent({
  showInternalToggle,
  floatingToggle,
}: {
  showInternalToggle?: boolean;
  floatingToggle?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar.Header>
        {!collapsed && <Heading as="h2" size="sm">Cube</Heading>}
        {showInternalToggle && <Sidebar.Toggle floating={floatingToggle} />}
      </Sidebar.Header>
      <Sidebar.Body>
        <NavRail />
      </Sidebar.Body>
      <Sidebar.Footer>
        {!collapsed && (
          <Text size="sm" color="neutral.muted">
            Footer slot
          </Text>
        )}
      </Sidebar.Footer>
    </>
  );
}

function AppShell({
  collapsed,
  onCollapsedChange,
  resizable,
  showInternalToggle,
  floatingToggle,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
  resizable?: boolean;
  showInternalToggle?: boolean;
  floatingToggle?: boolean;
}) {
  return (
    <SplitLayout>
      <Sidebar
        aria-label="Primary"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        resizable={resizable}
        width="md"
      >
        <SidebarContent
          showInternalToggle={showInternalToggle}
          floatingToggle={floatingToggle}
        />
      </Sidebar>
      <SplitLayout.Main>
        <Box gap="md" padding="lg">
          <Heading as="h1" size="md">Main content</Heading>
          <Text size="md" color="neutral.muted">
            Sidebar stays in document flow — unlike Sheet, it does not portal or scrim the page.
            Collapsed rail width is <code>3.6rem</code>; nav rows use{" "}
            <code>ActionMenuItem</code> (labeled expanded, <code>iconOnly</code> collapsed).
          </Text>
        </Box>
      </SplitLayout.Main>
    </SplitLayout>
  );
}

const meta: Meta<typeof Sidebar> = {
  title: "Core/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => <AppShell showInternalToggle />,
};

export const CollapsedRail: Story = {
  render: () => <AppShell collapsed showInternalToggle />,
};

export const Resizable: Story = {
  render: () => <AppShell resizable showInternalToggle />,
};

export const ExternalToggle: Story = {
  render: function ExternalToggleStory() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <SplitLayout>
        <Sidebar aria-label="Primary" collapsed={collapsed} onCollapsedChange={setCollapsed} width="md">
          <SidebarContent />
        </Sidebar>
        <SplitLayout.Main>
          <Box gap="md" padding="lg">
            <Button onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </Button>
            <Text size="md" color="neutral.muted">
              Collapse can be driven from outside the sidebar via controlled{" "}
              <code>collapsed</code> / <code>onCollapsedChange</code>.
            </Text>
          </Box>
        </SplitLayout.Main>
      </SplitLayout>
    );
  },
};

export const FloatingToggle: Story = {
  render: () => <AppShell showInternalToggle floatingToggle />,
};

export const DockToggleCorner: Story = {
  render: function DockToggleCornerStory() {
    return (
      <SplitLayout>
        <Sidebar aria-label="Primary" defaultCollapsed width="sm">
          <Sidebar.Header>
            <Sidebar.Toggle floating floatingAlign="corner">
              <DockToggleIcon />
            </Sidebar.Toggle>
          </Sidebar.Header>
          <Sidebar.Body>
            <NavRail />
          </Sidebar.Body>
        </Sidebar>
        <SplitLayout.Main>
          <Box gap="md" padding="lg">
            <Text size="md" color="neutral.muted">
              Custom toggle icons via <code>Sidebar.Toggle</code> children.{" "}
              <code>floatingAlign="corner"</code> keeps the control top-right when collapsed.
            </Text>
          </Box>
        </SplitLayout.Main>
      </SplitLayout>
    );
  },
};

export const RightEdge: Story = {
  render: () => (
    <SplitLayout>
      <SplitLayout.Main>
        <Box gap="md" padding="lg">
          <Heading as="h1" size="md">Main first</Heading>
        </Box>
      </SplitLayout.Main>
      <Sidebar aria-label="Secondary" edge="right" width="sm">
        <Sidebar.Header>
          <Heading as="h2" size="sm">Panel</Heading>
          <Sidebar.Toggle />
        </Sidebar.Header>
        <Sidebar.Body>
          <NavRail />
        </Sidebar.Body>
      </Sidebar>
    </SplitLayout>
  ),
};
