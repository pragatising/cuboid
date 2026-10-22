import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { Box } from "../Box";
import { Text } from "../Text";
import { Overlay } from "./Overlay";

const demoPageStyle: React.CSSProperties = {
  minHeight: "12rem",
  padding: "1.5rem",
  background: "#f9f9f8",
  borderRadius: "0.5rem",
};

function OverlayDemo({
  variant,
  dismissible = true,
}: {
  variant: "modal" | "sheet" | "none";
  dismissible?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box gap="sm">
        <Button onClick={() => setOpen(true)}>Show {variant} overlay</Button>
        <div style={demoPageStyle}>
          <Text size="md">
            Page content stays visible behind the scrim.{" "}
            {variant === "none"
              ? "The none variant is transparent and does not block clicks."
              : "Click the scrim or press Escape to dismiss."}
          </Text>
        </div>
      </Box>
      <Overlay
        open={open}
        variant={variant}
        onDismiss={dismissible ? () => setOpen(false) : undefined}
      />
    </>
  );
}

const meta: Meta<typeof Overlay> = {
  title: "Core/Overlay",
  component: Overlay,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    style: { control: false },
    className: { control: false },
    onDismiss: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof Overlay>;

export const Playground: Story = {
  render: () => <OverlayDemo variant="modal" />,
};

export const Modal: Story = {
  render: () => <OverlayDemo variant="modal" />,
};

export const Sheet: Story = {
  render: () => <OverlayDemo variant="sheet" />,
};

export const None: Story = {
  name: "None (transparent)",
  render: () => <OverlayDemo variant="none" />,
};

export const NonDismissible: Story = {
  render: () => <OverlayDemo variant="modal" dismissible={false} />,
};
