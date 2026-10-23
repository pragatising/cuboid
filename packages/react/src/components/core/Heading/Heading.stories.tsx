import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Core/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    as: { control: "select", options: ["h1", "h2", "h3", "h4", "h5", "h6"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    color: { control: "select", options: [undefined, "neutral.contrast", "neutral.muted", "success.strong", "danger.strong", "informational.strong"] },
  },
};
export default meta;
type Story = StoryObj<typeof Heading>;

export const Playground: Story = {
  args: { children: "Heading" },
};

export const Sizes: Story = {
  render: () => (
    <Box gap="sm">
      {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((size) => (
        <Heading key={size} as={size} size={size}>
          {size}: the {size === "h6" ? "uppercase label" : "heading"} step
        </Heading>
      ))}
    </Box>
  ),
};

export const LevelIsIndependentOfSize: Story = {
  name: "Level is independent of size",
  render: () => (
    <Box gap="sm">
      <Heading as="h1" size="h3">An h1 that looks small</Heading>
      <Heading as="h4" size="h1">An h4 that looks large</Heading>
    </Box>
  ),
};

export const Colors: Story = {
  render: () => (
    <Box gap="xs">
      <Heading size="h2">Default colour</Heading>
      {(["neutral.muted", "success.strong", "danger.strong", "informational.strong"] as const).map((color) => (
        <Heading key={color} size="h2" color={color}>
          color=&quot;{color}&quot;
        </Heading>
      ))}
    </Box>
  ),
};
