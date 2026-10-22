import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { ActionMenu } from "./ActionMenu";
import { ActionMenuItem } from "./ActionMenuItem";
import { ActionMenuList } from "./ActionMenuList";

const meta: Meta<typeof ActionMenu> = {
  title: "Core/ActionMenu",
  component: ActionMenu,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof ActionMenu>;

export const Default: Story = {
  render: () => (
    <ActionMenu
      trigger={
        <Button variant="secondary" size="sm">
          Actions
        </Button>
      }
      aria-label="Actions"
    >
      <ActionMenuItem>Edit</ActionMenuItem>
      <ActionMenuItem>Duplicate</ActionMenuItem>
      <ActionMenuItem disabled>Delete</ActionMenuItem>
    </ActionMenu>
  ),
};

export const Controlled: Story = {
  render: function ControlledMenu() {
    const [open, setOpen] = useState(false);
    return (
      <Box gap="sm" flexDirection="row">
        <ActionMenu
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button variant="secondary" size="sm">
              {open ? "Close" : "Open"} menu
            </Button>
          }
          aria-label="Controlled menu"
        >
          <ActionMenuItem onClick={() => console.log("edit")}>Edit</ActionMenuItem>
          <ActionMenuItem>Duplicate</ActionMenuItem>
        </ActionMenu>
        <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
          Toggle externally
        </Button>
      </Box>
    );
  },
};

export const WithSections: Story = {
  render: () => (
    <ActionMenu
      trigger={
        <Button variant="secondary" size="sm">
          Workspaces
        </Button>
      }
      aria-label="Workspaces"
    >
      <ActionMenuList.Section label="Section one">
        <ActionMenuItem>Copy</ActionMenuItem>
        <ActionMenuItem>Paste</ActionMenuItem>
      </ActionMenuList.Section>
      <ActionMenuList.Section label="Section two">
        <ActionMenuItem selected>Current workspace</ActionMenuItem>
        <ActionMenuItem>Another workspace</ActionMenuItem>
      </ActionMenuList.Section>
    </ActionMenu>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <ActionMenu
      trigger={
        <Button variant="secondary" size="sm">
          Filter
        </Button>
      }
      aria-labelledby="menu-header-title"
      closeOnSelect={false}
    >
      <ActionMenuList.Header>
        <Box flexDirection="row" gap="sm" alignItems="center">
          <span id="menu-header-title" style={{ flex: 1 }}>
            <Text size="sm" weight="semibold">
              Filter
            </Text>
          </span>
          <IconButton aria-label="Close" variant="ghost" size="sm" icon={<Icon name="close" />} />
        </Box>
      </ActionMenuList.Header>
      <ActionMenuItem selected keepOpenOnSelect>
        Active only
      </ActionMenuItem>
      <ActionMenuItem keepOpenOnSelect>
        Archived
      </ActionMenuItem>
      <ActionMenuList.Footer>
        <Box flexDirection="row" gap="sm" justifyContent="space-between">
          <Button variant="secondary" size="xs">
            Reset
          </Button>
          <Button variant="primary" size="xs">
            Done
          </Button>
        </Box>
      </ActionMenuList.Footer>
    </ActionMenu>
  ),
};

export const LongListScrollable: Story = {
  name: "maxHeight (scrollable long list)",
  render: () => (
    <ActionMenu
      trigger={
        <Button variant="secondary" size="sm">
          Choose a fruit
        </Button>
      }
      aria-label="Fruits"
      maxHeight="240px"
    >
      {[
        "Apple", "Apricot", "Banana", "Blackberry", "Blueberry", "Cherry",
        "Date", "Elderberry", "Fig", "Grape", "Grapefruit", "Guava",
        "Kiwi", "Lemon", "Lime", "Mango", "Melon", "Nectarine",
        "Orange", "Papaya", "Peach", "Pear", "Persimmon", "Pineapple",
      ].map((fruit) => (
        <ActionMenuItem key={fruit}>{fruit}</ActionMenuItem>
      ))}
    </ActionMenu>
  ),
};

export const ListOnly: Story = {
  name: "ActionMenuList (primitive)",
  render: () => (
    <div style={{ width: 260 }}>
      <ActionMenuList aria-label="Item states">
        <ActionMenuItem>Rest</ActionMenuItem>
        <ActionMenuItem selected>Selected</ActionMenuItem>
        <ActionMenuItem disabled>Disabled</ActionMenuItem>
        <ActionMenuItem leadingIcon={<Icon name="home" />}>With icon</ActionMenuItem>
        <ActionMenuItem subtext="Supporting text">With subtext</ActionMenuItem>
        <ActionMenuItem hasSubmenu>Submenu</ActionMenuItem>
      </ActionMenuList>
    </div>
  ),
};
