import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { HomeIcon, SettingsIcon } from "../../../icons/material";
import { ActionMenuItem } from "../ActionMenu";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { SplitLayout } from "../SplitLayout";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Sidebar, useSidebar } from "./Sidebar";

function SidebarNavItem({
  label,
  icon,
  selected = false,
}: {
  label: string;
  icon: React.ReactElement;
  selected?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <ActionMenuItem
      iconOnly={collapsed}
      leadingIcon={<Icon size="sm">{icon}</Icon>}
      selected={selected}
      showSelectionCheck={false}
      aria-label={collapsed ? label : undefined}
    >
      {label}
    </ActionMenuItem>
  );
}

function NavRail() {
  const { collapsed } = useSidebar();

  return (
    <Stack
      gap="xxs"
      padding="none"
      align={collapsed ? "center" : "stretch"}
      style={{ width: collapsed ? undefined : "100%" }}
    >
      <SidebarNavItem label="Home" icon={<HomeIcon />} selected />
      <SidebarNavItem label="Settings" icon={<SettingsIcon />} />
    </Stack>
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
        {!collapsed && <Text variant="titleSmall">Cube</Text>}
        {showInternalToggle && <Sidebar.Toggle floating={floatingToggle} />}
      </Sidebar.Header>
      <Sidebar.Body>
        <NavRail />
      </Sidebar.Body>
      <Sidebar.Footer>
        {!collapsed && (
          <Text variant="caption" color="muted">
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
        <Stack gap="md" padding="lg">
          <Text variant="titleMedium">Main content</Text>
          <Text variant="bodyMedium" color="muted">
            Sidebar stays in document flow — unlike Sheet, it does not portal or scrim the page.
            Collapsed rail width is <code>5.6rem</code>; nav rows use{" "}
            <code>ActionMenuItem</code> (labeled expanded, <code>iconOnly</code> collapsed).
          </Text>
        </Stack>
      </SplitLayout.Main>
    </SplitLayout>
  );
}

const meta: Meta<typeof Sidebar> = {
  title: "Core/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            In-flow navigation shell with optional collapse and resize. Tokens from{" "}
            <code>tokens/functional/components/sidebar/</code>. Pair with{" "}
            <code>SplitLayout</code> for a full app frame. Nav demos compose{" "}
            <code>ActionMenuItem</code> — full row when expanded, <code>iconOnly</code> in the{" "}
            <code>5.6rem</code> rail.
          </Subtitle>
          <Primary />
          <Controls />
        </>
      ),
    },
  },
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
          <Stack gap="md" padding="lg">
            <Button onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </Button>
            <Text variant="bodyMedium" color="muted">
              Collapse can be driven from outside the sidebar via controlled{" "}
              <code>collapsed</code> / <code>onCollapsedChange</code>.
            </Text>
          </Stack>
        </SplitLayout.Main>
      </SplitLayout>
    );
  },
};

export const FloatingToggle: Story = {
  render: () => <AppShell showInternalToggle floatingToggle />,
};

export const RightEdge: Story = {
  render: () => (
    <SplitLayout>
      <SplitLayout.Main>
        <Stack gap="md" padding="lg">
          <Text variant="titleMedium">Main first</Text>
        </Stack>
      </SplitLayout.Main>
      <Sidebar aria-label="Secondary" edge="right" width="sm">
        <Sidebar.Header>
          <Text variant="titleSmall">Panel</Text>
          <Sidebar.Toggle />
        </Sidebar.Header>
        <Sidebar.Body>
          <NavRail />
        </Sidebar.Body>
      </Sidebar>
    </SplitLayout>
  ),
};
