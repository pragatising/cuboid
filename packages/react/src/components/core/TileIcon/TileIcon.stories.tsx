import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { TileIcon } from "./TileIcon";

const meta: Meta<typeof TileIcon> = {
  title: "Core/TileIcon",
  component: TileIcon,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg"] },
    backgroundColor: { control: "select", options: ["canvas.inset", "informational.subtle", "success.subtle", "danger.subtle", "indigo.0"] },
    color: { control: "select", options: ["neutral.muted", "neutral.contrast", "informational.strong", "danger.strong"] },
  },
};
export default meta;
type Story = StoryObj<typeof TileIcon>;

export const Default: Story = { args: { name: "celebration" } };

export const Colours: Story = {
  render: () => (
    <Box flexDirection="row" gap="sm" alignItems="center">
      <TileIcon name="celebration" />
      <TileIcon name="celebration" backgroundColor="informational.subtle" color="informational.strong" />
      <TileIcon name="celebration" backgroundColor="danger.subtle" color="danger.strong" />
      <TileIcon name="celebration" backgroundColor="#1c1c1b" color="#ffffff" />
    </Box>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="row" gap="sm" alignItems="center">
      <TileIcon name="celebration" size="xs" />
      <TileIcon name="celebration" size="sm" />
      <TileIcon name="celebration" size="md" />
      <TileIcon name="celebration" size="lg" />
    </Box>
  ),
};
