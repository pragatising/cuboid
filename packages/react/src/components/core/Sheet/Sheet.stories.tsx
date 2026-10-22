import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Box } from "../Box";
import { Heading } from "../Heading";
import { Text } from "../Text";
import { Sheet, type SheetEdge } from "./Sheet";

function SheetDemo({
  edge,
  modal = true,
  roundedTop = true,
  width,
  resizable,
  label,
}: {
  edge: SheetEdge;
  modal?: boolean;
  roundedTop?: boolean;
  width?: "sm" | "md" | "lg";
  resizable?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open {label}</Button>
      <Sheet
        open={open}
        edge={edge}
        modal={modal}
        roundedTop={roundedTop}
        width={width}
        resizable={resizable}
        onOpenChange={setOpen}
        aria-label={label}
      >
        <Sheet.Body>
          <Box gap="md">
            <Heading as="h2" size="sm">{label}</Heading>
            <Text size="md" color="neutral.muted">
              Simple sheet — content in <code>Sheet.Body</code> only.
            </Text>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Box>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

function StickyHeaderDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet with sticky header</Button>
      <Sheet
        open={open}
        edge="right"
        onOpenChange={setOpen}
        aria-labelledby="sheet-filters-title"
      >
        <Sheet.Header>
          <span id="sheet-filters-title">
            <Heading as="h2" size="sm">Filters</Heading>
          </span>
          <IconButton aria-label="Close" variant="ghost" size="sm" onClick={() => setOpen(false)} icon={<Icon name="close" />} />
        </Sheet.Header>
        <Sheet.Body>
          <Box gap="sm">
            {Array.from({ length: 24 }, (_, i) => (
              <Text key={i} size="md">
                Filter option {i + 1}
              </Text>
            ))}
          </Box>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

const meta: Meta<typeof Sheet> = {
  title: "Core/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    style: { control: false },
    className: { control: false },
    onOpenChange: { control: false },
    children: { control: false },
    edge: { control: "radio", options: ["left", "right", "bottom"] },
    modal: { control: "boolean" },
    roundedTop: { control: "boolean" },
    width: { control: "select", options: ["sm", "md", "lg"] },
    resizable: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Sheet>;

export const Playground: Story = {
  render: () => <SheetDemo edge="right" label="Sheet panel" />,
};

export const StickyHeader: Story = {
  name: "Header + scrollable body",
  render: () => <StickyHeaderDemo />,
};

export const WidthLarge: Story = {
  name: "Width lg",
  render: () => <SheetDemo edge="right" width="lg" label="Large sheet (560px)" />,
};

export const Resizable: Story = {
  render: () => (
    <SheetDemo edge="right" resizable label="Resizable sheet — drag the inner edge" />
  ),
};

export const Right: Story = {
  render: () => <SheetDemo edge="right" label="Right sheet" />,
};

export const Left: Story = {
  render: () => <SheetDemo edge="left" label="Left sheet" />,
};

export const Bottom: Story = {
  render: () => <SheetDemo edge="bottom" label="Bottom sheet (rounded top)" />,
};

export const BottomFlat: Story = {
  name: "Bottom (square top)",
  render: () => (
    <SheetDemo edge="bottom" roundedTop={false} label="Bottom sheet (square top)" />
  ),
};

export const NonModal: Story = {
  name: "Non-modal (no scrim)",
  render: () => <SheetDemo edge="right" modal={false} label="Non-modal sheet" />,
};
