import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Popover } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Core/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    placement: { control: "select", options: ["top", "top-start", "top-end", "bottom", "bottom-start", "bottom-end", "left", "right"] },
    elevation: { control: "radio", options: ["3x", "4x"] },
    role: { control: "select", options: [undefined, "dialog", "menu", "listbox", "tree", "grid"] },
  },
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover trigger={<Button variant="secondary" size="sm">Open popover</Button>}>
      <Popover.Body>
        <Text size="sm">Any content can go here. With no role it is a plain region; give it one when it is something specific.</Text>
        <Button variant="primary" size="sm">Action</Button>
      </Popover.Body>
    </Popover>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);
    return (
      <Box gap="sm" flexDirection="row">
        <Popover open={open} onOpenChange={setOpen} trigger={<Button variant="secondary" size="sm">{open ? "Close" : "Open"} popover</Button>}>
          <Popover.Body>
            <Text size="sm">Controlled with open / onOpenChange.</Text>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Dismiss</Button>
          </Popover.Body>
        </Popover>
        <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>Toggle externally</Button>
      </Box>
    );
  },
};

export const Placements: Story = {
  render: () => (
    <Box padding="xxl" gap="xl" flexDirection="row" flexWrap="wrap" justifyContent="center">
      {(["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end", "left", "right"] as const).map((placement) => (
        <Popover key={placement} placement={placement} trigger={<Button variant="secondary" size="sm">{placement}</Button>}>
          <Popover.Body>
            <Text size="sm">{placement}</Text>
          </Popover.Body>
        </Popover>
      ))}
    </Box>
  ),
};

export const Elevation: Story = {
  render: () => (
    <Box flexDirection="row" gap="md">
      {(["3x", "4x"] as const).map((elevation) => (
        <Popover key={elevation} elevation={elevation} trigger={<Button variant="secondary" size="sm">{elevation}</Button>}>
          <Popover.Body>
            <Text size="sm">Elevation {elevation}</Text>
          </Popover.Body>
        </Popover>
      ))}
    </Box>
  ),
};

export const DialogWithHeaderAndFooter: Story = {
  name: "Dialog: header, body and footer",
  render: function DialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen} role="dialog" elevation="4x" trigger={<Button variant="secondary" size="sm">Edit link</Button>}>
        <Popover.Header onClose={() => setOpen(false)}>Edit link</Popover.Header>
        <Popover.Body>
          <Text size="md">A string header is the title: it names the dialog. The close button is the header&apos;s <code>onClose</code>.</Text>
        </Popover.Body>
        <Popover.Footer
          align="left"
          primary={{ label: "Save", onClick: () => setOpen(false) }}
          secondary={{ label: "Cancel", onClick: () => setOpen(false) }}
        />
      </Popover>
    );
  },
};

export const FooterJustified: Story = {
  name: "Footer: justified actions",
  render: function JustifiedStory() {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen} role="dialog" aria-label="Filter" trigger={<Button variant="secondary" size="sm">Filter</Button>}>
        <Popover.Body>
          <Text size="md">Secondary on the left, primary on the right.</Text>
        </Popover.Body>
        <Popover.Footer primary={{ label: "Done", onClick: () => setOpen(false) }} secondary={{ label: "Reset" }} />
      </Popover>
    );
  },
};

export const CustomHeader: Story = {
  name: "Header: any content",
  render: () => (
    <Popover role="dialog" aria-label="Custom header" trigger={<Button variant="secondary" size="sm">Custom header</Button>}>
      <Popover.Header>
        <Text size="md" weight="semibold">Anything can lead the panel</Text>
      </Popover.Header>
      <Popover.Body>
        <Text size="md">Only a string header is treated as the title; any other node is rendered as it is, inside the same chrome.</Text>
      </Popover.Body>
    </Popover>
  ),
};

export const MaxHeight: Story = {
  name: "maxHeight: the content scrolls, header and footer stay",
  render: () => (
    <Popover role="dialog" aria-label="Long content" maxHeight="14rem" trigger={<Button variant="secondary" size="sm">Long content</Button>}>
      <Popover.Header>Long content</Popover.Header>
      <Popover.Body>
        {Array.from({ length: 20 }, (_, index) => (
          <Text key={index} size="sm">Line {index + 1}</Text>
        ))}
      </Popover.Body>
      <Popover.Footer primary={{ label: "Done" }} />
    </Popover>
  ),
};

export const Portal: Story = {
  name: "Portal (not clipped by overflow: hidden)",
  render: () => (
    <div style={{ overflow: "hidden", height: 72, padding: 12 }}>
      <Popover trigger={<Button variant="secondary" size="sm">Open inside clipped box</Button>}>
        <Popover.Body>
          <Text size="md">Still visible: portaled to document.body.</Text>
        </Popover.Body>
      </Popover>
    </div>
  ),
};
