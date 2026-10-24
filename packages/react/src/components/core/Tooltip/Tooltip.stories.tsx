import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Core/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    type: { control: "radio", options: ["description", "label"] },
    placement: { control: "select", options: ["top", "top-start", "top-end", "bottom", "bottom-start", "bottom-end", "left", "right"] },
    delay: { control: "radio", options: ["short", "medium", "long"] },
  },
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Description: Story = {
  args: { text: "Saves to the cloud", placement: "bottom" },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="secondary" size="md">Save</Button>
    </Tooltip>
  ),
};

export const Label: Story = {
  name: "Label (names an icon-only trigger)",
  render: () => (
    <Tooltip type="label" text="Settings">
      <IconButton aria-label="Settings" disableTooltip icon={<Icon name="settings" />} />
    </Tooltip>
  ),
};

export const WithKeybindingHint: Story = {
  render: () => (
    <Tooltip text="Save" keybindingHint="Mod+S">
      <Button variant="secondary" size="md">Save</Button>
    </Tooltip>
  ),
};

export const OnIconButton: Story = {
  name: "On IconButton (built in)",
  render: () => (
    <Box flexDirection="row" gap="md">
      <IconButton aria-label="Settings" variant="ghost" icon={<Icon name="settings" />} />
      <IconButton aria-label="Search" keybindingHint="Mod+K" variant="ghost" icon={<Icon name="search" />} />
      <IconButton aria-label="Delete" description="Deletes the file for everyone" disabled variant="ghost" icon={<Icon name="delete" />} />
    </Box>
  ),
};

export const Placements: Story = {
  render: () => (
    <Box padding="xxl" gap="xl" alignItems="center">
      {(["top", "bottom", "left", "right"] as const).map((placement) => (
        <Tooltip key={placement} text={placement} placement={placement}>
          <Button variant="rounded" size="md">{placement}</Button>
        </Tooltip>
      ))}
    </Box>
  ),
};

export const Delays: Story = {
  render: () => (
    <Box flexDirection="row" gap="md">
      {(["short", "medium", "long"] as const).map((delay) => (
        <Tooltip key={delay} text={`${delay} delay`} delay={delay}>
          <Button variant="secondary" size="md">{delay}</Button>
        </Tooltip>
      ))}
    </Box>
  ),
};

export const LongText: Story = {
  render: () => (
    <Tooltip text="Tooltips have low discoverability and do not work on touch: never put essential information in one.">
      <Button variant="secondary" size="md">Hover for guidance</Button>
    </Tooltip>
  ),
};

export const Portal: Story = {
  name: "Portal (not clipped by overflow: hidden)",
  render: () => (
    <div style={{ overflow: "hidden", height: 72, padding: 12 }}>
      <Tooltip text="Still visible: portaled to document.body">
        <Button variant="secondary" size="md">Hover inside clipped box</Button>
      </Tooltip>
    </div>
  ),
};
