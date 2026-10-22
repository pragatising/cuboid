import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { ActionMenu } from "./ActionMenu";

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
      <ActionMenu.Item>Edit</ActionMenu.Item>
      <ActionMenu.Item>Duplicate</ActionMenu.Item>
      <ActionMenu.Item disabled>Delete</ActionMenu.Item>
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
          <ActionMenu.Item onClick={() => console.log("edit")}>Edit</ActionMenu.Item>
          <ActionMenu.Item>Duplicate</ActionMenu.Item>
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
      <ActionMenu.Section label="Section one">
        <ActionMenu.Item>Copy</ActionMenu.Item>
        <ActionMenu.Item>Paste</ActionMenu.Item>
      </ActionMenu.Section>
      <ActionMenu.Section label="Section two">
        <ActionMenu.Item selected>Current workspace</ActionMenu.Item>
        <ActionMenu.Item>Another workspace</ActionMenu.Item>
      </ActionMenu.Section>
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
      <ActionMenu.Header>
        <Box flexDirection="row" gap="sm" alignItems="center">
          <span id="menu-header-title" style={{ flex: 1 }}>
            <Text size="sm" weight="semibold">
              Filter
            </Text>
          </span>
          <IconButton aria-label="Close" variant="ghost" size="sm" icon={<Icon name="close" />} />
        </Box>
      </ActionMenu.Header>
      <ActionMenu.Item selected keepOpenOnSelect>
        Active only
      </ActionMenu.Item>
      <ActionMenu.Item keepOpenOnSelect>
        Archived
      </ActionMenu.Item>
      <ActionMenu.Footer>
        <Box flexDirection="row" gap="sm" justifyContent="space-between">
          <Button variant="secondary" size="xs">
            Reset
          </Button>
          <Button variant="primary" size="xs">
            Done
          </Button>
        </Box>
      </ActionMenu.Footer>
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
        <ActionMenu.Item key={fruit}>{fruit}</ActionMenu.Item>
      ))}
    </ActionMenu>
  ),
};

export const ListOnly: Story = {
  name: "ActionMenu.List (primitive)",
  render: () => (
    <div style={{ width: 260 }}>
      <ActionMenu.List aria-label="Item states">
        <ActionMenu.Item>Rest</ActionMenu.Item>
        <ActionMenu.Item selected>Selected</ActionMenu.Item>
        <ActionMenu.Item disabled>Disabled</ActionMenu.Item>
        <ActionMenu.Item leadingVisual={<Icon name="home" />}>With icon</ActionMenu.Item>
        <ActionMenu.Item description="Supporting text">With subtext</ActionMenu.Item>
        <ActionMenu.Item hasSubmenu>Submenu</ActionMenu.Item>
      </ActionMenu.List>
    </div>
  ),
};

export const SingleSelection: Story = {
  name: "selectionMode: single (radios)",
  render: function SingleStory() {
    const [sort, setSort] = useState("Name");
    return (
      <ActionMenu trigger={<Button variant="secondary" size="sm">Sort by {sort}</Button>} aria-label="Sort by" selectionMode="single">
        {["Name", "Date", "Size"].map((option) => (
          <ActionMenu.Item key={option} selected={sort === option} onClick={() => setSort(option)}>
            {option}
          </ActionMenu.Item>
        ))}
      </ActionMenu>
    );
  },
};

export const MultipleSelection: Story = {
  name: "selectionMode: multiple (checkboxes, menu stays open)",
  render: function MultipleStory() {
    const [chosen, setChosen] = useState<string[]>(["Active"]);
    const toggle = (name: string) => setChosen((now) => (now.includes(name) ? now.filter((item) => item !== name) : [...now, name]));
    return (
      <ActionMenu trigger={<Button variant="secondary" size="sm">Status ({chosen.length})</Button>} aria-label="Status" selectionMode="multiple" closeOnSelect={false}>
        {["Active", "Archived", "Draft"].map((name) => (
          <ActionMenu.Item key={name} selected={chosen.includes(name)} onClick={() => toggle(name)}>
            {name}
          </ActionMenu.Item>
        ))}
      </ActionMenu>
    );
  },
};
