import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { CloseIcon } from "../../../icons/material";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
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
        onDismiss={() => setOpen(false)}
        aria-label={label}
      >
        <Sheet.Body>
          <Stack gap="md">
            <Text role="heading" size="sm">{label}</Text>
            <Text role="body" size="sm" color="muted">
              Simple sheet — content in <code>Sheet.Body</code> only.
            </Text>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Stack>
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
        onDismiss={() => setOpen(false)}
        aria-labelledby="sheet-filters-title"
      >
        <Sheet.Header>
          <span id="sheet-filters-title">
            <Text role="heading" size="sm">Filters</Text>
          </span>
          <IconButton aria-label="Close" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Sheet.Header>
        <Sheet.Body>
          <Stack gap="sm">
            {Array.from({ length: 24 }, (_, i) => (
              <Text key={i} role="body" size="sm">
                Filter option {i + 1}
              </Text>
            ))}
          </Stack>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

const meta: Meta<typeof Sheet> = {
  title: "Core/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Slide-in panel above <code>Overlay</code>. The shell has no padding — use{" "}
            <code>Sheet.Header</code> (fixed) and <code>Sheet.Body</code> (scrollable). Edge
            outline comes from <code>shadows.sheet</code>, not a border.{" "}
            <code>roundedTop</code> applies to bottom sheets only. Left/right:{" "}
            <code>width</code> (<code>sm</code> / <code>md</code> / <code>lg</code> or CSS length),{" "}
            optional <code>resizable</code> via shared <code>ResizeHandle</code>.
          </Subtitle>
          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    theme: { control: false },
    style: { control: false },
    className: { control: false },
    onDismiss: { control: false },
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
