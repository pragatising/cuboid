import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { ActionMenu } from "./ActionMenu";
import { ActionMenuItem } from "./ActionMenuItem";
import { ActionMenuList } from "./ActionMenuList";

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden focusable={false}>
    <path d="M10 3.5 4 8.5v7h4v-4h4v4h4v-7L10 3.5z" />
  </svg>
);

const meta: Meta<typeof ActionMenu> = {
  title: "Core/ActionMenu",
  component: ActionMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Dropdown menu — Figma <code>ActionMenu</code>. Composes trigger +{" "}
            <code>Popover</code> + <code>ActionMenuList</code> with arrow-key navigation.
          </Subtitle>
          <Primary />
          <Controls />
        </>
      ),
    },
  },
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
      <Stack gap="sm" direction="horizontal">
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
      </Stack>
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
        <Stack direction="horizontal" gap="sm" style={{ alignItems: "center" }}>
          <span id="menu-header-title" style={{ flex: 1 }}>
            <Text variant="bodySmall" style={{ fontWeight: 600 }}>
              Filter
            </Text>
          </span>
          <IconButton aria-label="Close" variant="ghost" size="sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </IconButton>
        </Stack>
      </ActionMenuList.Header>
      <ActionMenuItem selected keepOpenOnSelect>
        Active only
      </ActionMenuItem>
      <ActionMenuItem keepOpenOnSelect>
        Archived
      </ActionMenuItem>
      <ActionMenuList.Footer>
        <Stack direction="horizontal" gap="sm" style={{ justifyContent: "space-between" }}>
          <Button variant="secondary" size="xs">
            Reset
          </Button>
          <Button variant="primary" size="xs">
            Done
          </Button>
        </Stack>
      </ActionMenuList.Footer>
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
        <ActionMenuItem leadingIcon={<HomeIcon />}>With icon</ActionMenuItem>
        <ActionMenuItem subtext="Supporting text">With subtext</ActionMenuItem>
        <ActionMenuItem hasSubmenu>Submenu</ActionMenuItem>
      </ActionMenuList>
    </div>
  ),
};
