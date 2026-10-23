import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ActionMenu } from "../ActionMenu";
import { Box } from "../Box";
import { Button } from "../Button";
import { Heading } from "../Heading";
import { Icon } from "../Icon";
import { SplitLayout } from "../SplitLayout";
import { Text } from "../Text";
import { Sidebar } from "./Sidebar";

/** Any node can lead the header: a user, an org, a team. This one is a user's initial. */
function UserBadge({ initial }: { initial: string }) {
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      borderRadius="full"
      backgroundColor="debug.strong"
      style={{ width: "1.5rem", height: "1.5rem" }}
    >
      <Text size="sm" color="neutral.inverted">{initial}</Text>
    </Box>
  );
}

/** The docs nav rail: sections of plain links (no icons), the first one current. */
function PlainNav() {
  return (
    <>
      <Sidebar.Section label="Primitives">
        <Sidebar.Item href="#button" current>Button</Sidebar.Item>
        <Sidebar.Item href="#text">Text</Sidebar.Item>
        <Sidebar.Item href="#box">Box</Sidebar.Item>
      </Sidebar.Section>
      <Sidebar.Section label="Layout">
        <Sidebar.Item href="#container">Container</Sidebar.Item>
        <Sidebar.Item href="#sidebar">Sidebar</Sidebar.Item>
      </Sidebar.Section>
    </>
  );
}

/** The same links with icons, which is what a collapsed rail shows. */
function IconNav() {
  return (
    <Sidebar.Section label="Workspace">
      <Sidebar.Item href="#home" current leadingVisual={<Icon name="home" size="sm" />}>Home</Sidebar.Item>
      <Sidebar.Item href="#inbox" leadingVisual={<Icon name="inbox" size="sm" />} trailingVisual={<Icon name="chevron_right" size="sm" />}>
        Inbox
      </Sidebar.Item>
      <Sidebar.Item href="#settings" leadingVisual={<Icon name="settings" size="sm" />}>Settings</Sidebar.Item>
    </Sidebar.Section>
  );
}

function Main({ children }: { children?: React.ReactNode }) {
  return (
    <SplitLayout.Main>
      <Box gap="md" padding="lg">
        <Heading as="h1" size="h2">Main content</Heading>
        <Text color="neutral.muted">
          The sidebar stays in document flow: unlike Sheet, it does not portal or scrim the page. Collapsed rail width is{" "}
          <code>3.6rem</code>.
        </Text>
        {children}
      </Box>
    </SplitLayout.Main>
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

export const NavRail: Story = {
  name: "Nav rail (the docs shell)",
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Components" width="sm">
        <Sidebar.Header leadingVisual={<UserBadge initial="J" />}>John Doe</Sidebar.Header>
        <Sidebar.Body>
          <PlainNav />
        </Sidebar.Body>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};

export const WithIcons: Story = {
  name: "With icons (collapse to see the rail)",
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Workspace" width="sm">
        <Sidebar.Header leadingVisual={<UserBadge initial="A" />}>Acme Inc</Sidebar.Header>
        <Sidebar.Body>
          <IconNav />
        </Sidebar.Body>
        <Sidebar.Footer>
          <Sidebar.Item href="#help" leadingVisual={<Icon name="help" size="sm" />}>Help</Sidebar.Item>
        </Sidebar.Footer>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};

export const CollapsedRail: Story = {
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Workspace" defaultCollapsed>
        <Sidebar.Header leadingVisual={<UserBadge initial="A" />}>Acme Inc</Sidebar.Header>
        <Sidebar.Body>
          <IconNav />
        </Sidebar.Body>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};

export const TeamHeader: Story = {
  name: "Header: a team icon instead of a user",
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Workspace" width="sm">
        <Sidebar.Header leadingVisual={<Icon name="groups" size="md" />}>Platform team</Sidebar.Header>
        <Sidebar.Body>
          <IconNav />
        </Sidebar.Body>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};

export const Resizable: Story = {
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Workspace" resizable>
        <Sidebar.Header leadingVisual={<UserBadge initial="J" />}>John Doe</Sidebar.Header>
        <Sidebar.Body>
          <IconNav />
        </Sidebar.Body>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};

export const ExternalToggle: Story = {
  name: "Collapse driven from outside (header without a toggle)",
  render: function ExternalToggleStory() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <SplitLayout>
        <Sidebar aria-label="Workspace" collapsed={collapsed} onCollapsedChange={setCollapsed} width="sm">
          <Sidebar.Header toggle={false} leadingVisual={<UserBadge initial="J" />}>John Doe</Sidebar.Header>
          <Sidebar.Body>
            <IconNav />
          </Sidebar.Body>
        </Sidebar>
        <Main>
          <Button onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </Button>
        </Main>
      </SplitLayout>
    );
  },
};

export const RightEdge: Story = {
  render: () => (
    <SplitLayout>
      <Main />
      <Sidebar aria-label="Details" edge="right" width="sm">
        <Sidebar.Header>Details</Sidebar.Header>
        <Sidebar.Body>
          <IconNav />
        </Sidebar.Body>
      </Sidebar>
    </SplitLayout>
  ),
};

export const AccountMenuHeader: Story = {
  name: "Header as a button (account menu)",
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Components" width="sm">
        <Sidebar.Header>
          <ActionMenu
            aria-label="Account"
            trigger={
              <Sidebar.HeaderButton leadingVisual={<UserBadge initial="J" />}>John Doe</Sidebar.HeaderButton>
            }
          >
            <ActionMenu.Item leadingVisual={<Icon name="settings" />}>Settings</ActionMenu.Item>
            <ActionMenu.Item leadingVisual={<Icon name="logout" />}>Log out</ActionMenu.Item>
          </ActionMenu>
        </Sidebar.Header>
        <Sidebar.Body>
          <PlainNav />
        </Sidebar.Body>
      </Sidebar>
      <Main />
    </SplitLayout>
  ),
};
